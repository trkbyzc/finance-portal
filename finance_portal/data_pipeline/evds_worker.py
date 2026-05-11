import evds
import redis
import sys
import json
import time
from datetime import datetime, timedelta

API_KEY = "***REMOVED***"
REDIS_HOST = "localhost"
REDIS_PORT = 6379

# 🚀 SENIOR DOKUNUŞU: Dış API'ler için Yeniden Deneme (Retry) Mekanizması
def fetch_with_retry(evds_api, keys, startdate, enddate, max_retries=3):
    for attempt in range(max_retries):
        try:
            print(f"EVDS'den veri bekleniyor... (Deneme {attempt + 1}/{max_retries})")
            return evds_api.get_data(keys, startdate=startdate, enddate=enddate)
        except Exception as e:
            print(f"⚠️ EVDS sunucusu yanit vermedi. Hata: {str(e)}")
            if attempt < max_retries - 1:
                print("5 saniye bekleniyor, tekrar denenecek...\n")
                time.sleep(5) # Sunucuyu boğmamak için 5 saniye bekle
            else:
                raise Exception("TCMB EVDS sunucularina ulasilamiyor. Daha sonra tekrar deneyin.")

def run_worker():
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()
        evds_api = evds.evdsAPI(API_KEY)

        # 1. MEVDUATLAR
        deposits_dict = {"TP.TRY.MT01": "evds:deposit:32", "TP.TRY.MT02": "evds:deposit:92", "TP.TRY.MT03": "evds:deposit:181", "TP.TRY.MT04": "evds:deposit:365", "TP.TRY.MT05": "evds:deposit:365_plus"}
        start_date_dep = (datetime.now() - timedelta(days=60)).strftime("%d-%m-%Y")
        end_date_dep = datetime.now().strftime("%d-%m-%Y")

        dep_data = fetch_with_retry(evds_api, list(deposits_dict.keys()), start_date_dep, end_date_dep)
        latest_dep = dep_data.ffill().iloc[-1]

        for code, redis_key in deposits_dict.items():
            val = latest_dep.get(code.replace(".", "_"))
            if val is not None and str(val).lower() != 'nan':
                r.set(redis_key, float(val), ex=43200)
                print(f"Deposit Success: {code} -> %{val} Redis'e yazildi.")

        # 2. TAHVİLLER
        bonds_dict = {"TP.TRD080726K10": "evds:benchmark:1m", "TP.TRD070727K10": "evds:benchmark:3m", "TP.TRT050728K21": "evds:benchmark:6m", "TP.TRT040729K21": "evds:benchmark:1y", "TP.TRT020130K18": "evds:benchmark:2y", "TP.TRT120331K39": "evds:benchmark:5y", "TP.TRT070335K16": "evds:benchmark:10y"}
        start_date_bond = (datetime.now() - timedelta(days=365)).strftime("%d-%m-%Y")
        end_date_bond = datetime.now().strftime("%d-%m-%Y")

        bond_data = fetch_with_retry(evds_api, list(bonds_dict.keys()), start_date_bond, end_date_bond).ffill()

        for code, redis_key in bonds_dict.items():
            column_name = code.replace(".", "_")
            history_list = []
            for index, row in bond_data.iterrows():
                val = row.get(column_name)
                date_str = row.get("Tarih")
                if val is not None and str(val).lower() != 'nan' and date_str:
                    try:
                        clean_date = datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
                        history_list.append({
                            "date": clean_date,
                            "time": clean_date,
                            "close": float(val),
                            "value": float(val),
                            "rate": float(val)
                        })
                    except ValueError:
                        continue

            if len(history_list) > 0:
                r.set(redis_key, json.dumps(history_list), ex=43200)
                r.set(f"evds:history:{code}", json.dumps(history_list), ex=43200)
                print(f"Bond Success: {code} -> {len(history_list)} gunluk veri Redis'e basildi.")

        # =========================================================
        # 🚀 3. DÖVİZ KURLARI (YENİ EKLENEN KISIM)
        # =========================================================
        currency_dict = {
            "TP.DK.USD.S.YTL": "USD",
            "TP.DK.EUR.S.YTL": "EUR",
            "TP.DK.GBP.S.YTL": "GBP",
            "TP.DK.CHF.S.YTL": "CHF",
            "TP.DK.CAD.S.YTL": "CAD",
            "TP.DK.AUD.S.YTL": "AUD",
            "TP.DK.JPY.S.YTL": "JPY",
            "TP.DK.DKK.S.YTL": "DKK",
            "TP.DK.SEK.S.YTL": "SEK",
            "TP.DK.NOK.S.YTL": "NOK",
            "TP.DK.SAR.S.YTL": "SAR",
            "TP.DK.RUB.S.YTL": "RUB"
        }

        # 5 Yıllık veri çekiyoruz (1825 gün)
        start_date_curr = (datetime.now() - timedelta(days=1825)).strftime("%d-%m-%Y")
        end_date_curr = datetime.now().strftime("%d-%m-%Y")

        print("\nDoviz Kurlari EVDS'den cekiliyor...")
        curr_data = fetch_with_retry(evds_api, list(currency_dict.keys()), start_date_curr, end_date_curr).ffill()

        for code, currency_name in currency_dict.items():
            column_name = code.replace(".", "_")
            history_list = []

            for index, row in curr_data.iterrows():
                val = row.get(column_name)
                date_str = row.get("Tarih")

                if val is not None and str(val).lower() != 'nan' and date_str:
                    try:
                        clean_date = datetime.strptime(date_str, "%d-%m-%Y").strftime("%Y-%m-%d")
                        float_val = float(val)

                        # 🚀 TCMB'den JPY 100 birim geldiği için 100'e bölüp 1 birimlik fiyatını kaydediyoruz
                        if currency_name == "JPY":
                            float_val = float_val / 100.0

                        history_list.append({
                            "date": clean_date,
                            "time": clean_date,
                            "close": float_val,
                            "value": float_val,
                            "rate": float_val
                        })
                    except ValueError:
                        continue

            if len(history_list) > 0:
                redis_key = f"evds:currency:{currency_name}"
                r.set(redis_key, json.dumps(history_list), ex=86400) # 24 saat önbellekte kalsın
                print(f"Currency Success: {currency_name} -> {len(history_list)} gunluk veri Redis'e basildi.")

    except Exception as e:
        print(f"\nSistem Hatasi: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    run_worker()