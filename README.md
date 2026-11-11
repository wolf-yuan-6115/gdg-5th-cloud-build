# 今天吃什麼？

使用 Bun、Next.js 與 HeroUI 內建深色主題的繁體中文點餐示範。可瀏覽菜單、隨機選餐、調整購物車及模擬結帳；沒有登入、資料庫、付款或真正的訂單。重新整理頁面會清空購物車。

## 本機啟動

準備 Bun 1.4.4；容器測試另需 Docker。

```bash
bun install --frozen-lockfile
bun run dev
```

開啟 <http://localhost:3000>。

```bash
bun run check
bun run build
PORT=8080 bun run start
```

## 修改菜單

編輯根目錄 `config.json`：

```json
{
  "items": [
    {
      "name": "滷肉飯",
      "description": "慢燉滷肉配上熱騰騰的白飯。",
      "category": "主食",
      "price": 65
    }
  ]
}
```

不需要填寫 ID，只需修改名稱、描述、分類及價格。文字欄位不可空白；`price` 為新臺幣整數，範圍 0–1,000,000。空的 `items` 合法。購物車每項最多 99 份。

開發時修改後重新整理即可；容器中的設定檔隨映像發布，必須重新建置。示範流程可修改名稱或價格，重新建置後比較畫面。

## API 使用

```bash
curl http://localhost:8080/api/items
curl http://localhost:8080/api/items/item-1
curl http://localhost:8080/api/items/random
```

| 端點 | 成功回應 | 其他狀態 |
| --- | --- | --- |
| `GET /api/items` | `{ "items": [...] }` | 設定讀取失敗：500 |
| `GET /api/items/[id]` | `{ "item": {...} }` | 不存在：404 |
| `GET /api/items/random` | `{ "item": {...} }` | 空菜單：404 |

API 會依菜單順序自動附上 `item-1`、`item-2` 等 ID；單品查詢使用清單回應中的 ID 即可。調整順序後 ID 會跟著改變，請重新整理頁面以重新載入菜單。

所有回應使用 `Cache-Control: no-store`，錯誤格式為 `{ "error": "訊息" }`。隨機抽選發生於伺服器，每項機率相同，結果可能重複；在瀏覽器開發者工具的 Network 面板觀察請求。模擬結帳只改變頁面狀態，不送出訂單請求。

## 示範建置前的資料驗證

Cloud Build 的 `check` 步驟會先驗證根目錄 `config.json`，再執行 lint、型別檢查與 Bun 測試；任何一項失敗，都會停止後續映像建置、推送與部署。

```bash
bun run validate:menu
bun run check
```

驗證包含價格是否為 0–1,000,000 的整數、必要文字欄位與設定檔格式。可將一項餐點的 `price` 暫時改成 `-1`，執行 `bun run validate:menu`，觀察非零結束碼與包含餐點順序與名稱的錯誤訊息；恢復合法價格後再執行，結果應通過。這個失敗示範可完全在本機完成。

## 本機容器與瀏覽器測試

```bash
docker build -t food-demo:local .
docker run --rm -d --name food-demo-local -p 127.0.0.1:8080:8080 food-demo:local
bun scripts/smoke.ts
bunx playwright install chromium
bunx playwright test
docker stop food-demo-local
```

`smoke.ts` 檢查三種 API、404、快取標頭與靜態資產；瀏覽器測試包含桌面及手機尺寸的點餐、結帳、重新整理與錯誤狀態。截圖位於 `test-results/`。

測試其他連接埠：

```bash
docker run --rm -d --name food-demo-local -e PORT=9090 -p 127.0.0.1:9090:9090 food-demo:local
BASE_URL=http://localhost:9090 bun scripts/smoke.ts
docker stop food-demo-local
```

## 手動操作 Google Cloud 示範

以下指令會建立雲端資源，請只在要進行雲端示範時自行執行。本機測試不需執行本節。需要已啟用帳單的專案、Google Cloud CLI，以及建立資源與設定 IAM 的管理權限。區域預設統一為 `us-central1`；區域選擇不保證所有流量或資源免費。

### 準備資源

替換專案 ID；專用示範專案方便於使用後清理。

```bash
export PROJECT_ID='your-project-id'
export REGION='us-central1'
export REPOSITORY='food-demo'
export SERVICE='food-demo'
export BUILD_SA="food-demo-build@${PROJECT_ID}.iam.gserviceaccount.com"
export RUNTIME_SA="food-demo-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
gcloud auth login
gcloud config set project "$PROJECT_ID"
gcloud services enable cloudbuild.googleapis.com artifactregistry.googleapis.com run.googleapis.com iam.googleapis.com logging.googleapis.com
gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION"
gcloud iam service-accounts create food-demo-build
gcloud iam service-accounts create food-demo-runtime
```

授權建置帳戶寫入映像、部署 Cloud Run 與設定公開存取、寫入日誌，以及使用執行帳戶：

```bash
gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" --location="$REGION" --member="serviceAccount:$BUILD_SA" --role=roles/artifactregistry.writer
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BUILD_SA" --role=roles/run.admin
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BUILD_SA" --role=roles/logging.logWriter
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --member="serviceAccount:$BUILD_SA" --role=roles/iam.serviceAccountUser
```

執行帳戶不需要額外資料存取權限。提交建置的人需要 Cloud Build Editor，以及建置帳戶上的 Service Account User；由管理者為實際使用者授權：

```bash
export DEMO_USER='your-email@example.com'
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="user:$DEMO_USER" --role=roles/cloudbuild.builds.editor
gcloud iam service-accounts add-iam-policy-binding "$BUILD_SA" --member="user:$DEMO_USER" --role=roles/iam.serviceAccountUser
```

### 提交與觀察建置

使用區域性來源儲存桶，並授權建置帳戶讀取來源。桶名必須全域唯一；下列名稱可自行替換。

```bash
export SOURCE_BUCKET="${PROJECT_ID}-food-demo-source"
gcloud storage buckets create "gs://$SOURCE_BUCKET" --location="$REGION" --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding "gs://$SOURCE_BUCKET" --member="serviceAccount:$BUILD_SA" --role=roles/storage.objectViewer
gcloud builds submit . \
  --region="$REGION" \
  --config=cloudbuild.yaml \
  --service-account="projects/$PROJECT_ID/serviceAccounts/$BUILD_SA" \
  --gcs-source-staging-dir="gs://$SOURCE_BUCKET/source" \
  --substitutions="_REGION=$REGION,_REPOSITORY=$REPOSITORY,_SERVICE=$SERVICE,_RUNTIME_SERVICE_ACCOUNT=$RUNTIME_SA"
```

在 Cloud Build 主控台依序觀察 `check`、`build`、`push`、`deploy`。每次映像使用該次 `$BUILD_ID`，Cloud Run 設為公開存取、512 MiB 記憶體、1 CPU、最少 0／最多 1 個實例。若組織政策禁止公開存取，部署會失敗，需先由管理者確認此示範專案的政策。

```bash
gcloud run services describe "$SERVICE" --region="$REGION" --format='value(status.url)'
gcloud run services logs read "$SERVICE" --region="$REGION" --limit=30
```

開啟服務網址，示範點餐與 API；修改 `config.json` 後再次提交，觀察新的建置 ID、Cloud Run revision 與菜單內容。

### 清理示範資源

以下指令會刪除本節建立的服務、映像、來源及服務帳戶，請確認變數指向示範資源。

```bash
gcloud run services delete "$SERVICE" --region="$REGION"
gcloud artifacts repositories delete "$REPOSITORY" --location="$REGION"
gcloud storage rm --recursive "gs://$SOURCE_BUCKET"
gcloud projects remove-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BUILD_SA" --role=roles/run.admin
gcloud projects remove-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BUILD_SA" --role=roles/logging.logWriter
gcloud iam service-accounts delete "$BUILD_SA"
gcloud iam service-accounts delete "$RUNTIME_SA"
```

如只為這次示範新增使用者的 Cloud Build Editor 權限，使用後亦可由管理者移除。日誌依專案保留政策到期，不會隨服務刪除立即消失。

操作參考：[Cloud Build 部署 Cloud Run](https://docs.cloud.google.com/build/docs/deploying-builds/deploy-cloud-run)、[自訂建置服務帳戶](https://docs.cloud.google.com/build/docs/securing-builds/configure-user-specified-service-accounts)。
