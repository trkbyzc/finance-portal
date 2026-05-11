package com.financeportal.repository.base;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean // Önemli: Spring bunu tek başına bir repository olarak ayağa kaldırmaya çalışmasın
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {
    // Şimdilik içi boş kalabilir, ileride tüm tablolarda ortak
    // kullanacağımız metodları buraya ekleyeceğiz.
}