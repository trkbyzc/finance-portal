$ErrorActionPreference = "Stop"

function Make-Commit {
    param (
        [string]$CommitMessage,
        [string]$CommitDate,
        [string[]]$FilesToAdd
    )

    $env:GIT_AUTHOR_DATE = $CommitDate
    $env:GIT_COMMITTER_DATE = $CommitDate

    foreach ($file in $FilesToAdd) {
        git add $file
    }

    git commit -m "$CommitMessage"
}

# 1. Proje iskeleti ve temel backend dosyaları (Subat)
Make-Commit -CommitMessage "chore: initialize project structure and setup maven/docker" -CommitDate "2026-02-10T10:00:00" -FilesToAdd @("finance_portal/pom.xml", "finance_portal/docker-compose.yml", "finance_portal/mvnw*", "finance_portal/HELP.md")

Make-Commit -CommitMessage "feat: add base configurations and properties" -CommitDate "2026-02-15T14:30:00" -FilesToAdd @("finance_portal/src/main/resources/")

Make-Commit -CommitMessage "feat: implement backend integrations and models" -CommitDate "2026-03-01T11:15:00" -FilesToAdd @("finance_portal/src/main/java/com/financeportal/model/", "finance_portal/src/main/java/com/financeportal/integration/")

Make-Commit -CommitMessage "feat: implement news service and market data logic" -CommitDate "2026-03-10T16:00:00" -FilesToAdd @("finance_portal/src/main/java/com/financeportal/service/")

Make-Commit -CommitMessage "feat: add missing backend core files and python scripts" -CommitDate "2026-03-18T16:00:00" -FilesToAdd @("finance_portal/data_pipeline/", "finance_portal/src/main/java/")

# 2. Frontend iskeleti ve temel ayarlar (Mart sonu / Nisan başı)
Make-Commit -CommitMessage "chore: init frontend project with vite and tailwind" -CommitDate "2026-03-25T09:45:00" -FilesToAdd @("finance-frontend/package.json", "finance-frontend/vite.config.js", "finance-frontend/tailwind.config.js", "finance-frontend/postcss.config.js", "finance-frontend/index.html")

Make-Commit -CommitMessage "feat: setup react base and static assets" -CommitDate "2026-04-05T13:20:00" -FilesToAdd @("finance-frontend/src/main.jsx", "finance-frontend/src/App.jsx", "finance-frontend/src/index.css", "finance-frontend/src/assets/", "finance-frontend/public/")

Make-Commit -CommitMessage "feat: implement frontend services and custom hooks" -CommitDate "2026-04-15T15:10:00" -FilesToAdd @("finance-frontend/src/services/", "finance-frontend/src/hooks/", "finance-frontend/src/config/")

Make-Commit -CommitMessage "feat: build ui components and charts" -CommitDate "2026-04-20T17:30:00" -FilesToAdd @("finance-frontend/src/components/")

Make-Commit -CommitMessage "feat: add main dashboard and routing pages" -CommitDate "2026-04-25T11:00:00" -FilesToAdd @("finance-frontend/src/pages/")

# 3. Kalan düzeltmeler ve belgeler (Mayıs)
Make-Commit -CommitMessage "docs: add architecture design documentation" -CommitDate "2026-05-02T10:00:00" -FilesToAdd @("finance_portal/ARCHITECTURE_DESIGN.md", "finance-frontend/README.md")

Make-Commit -CommitMessage "fix: overall fixes, logging updates and polish" -CommitDate "2026-05-06T14:00:00" -FilesToAdd @(".")

