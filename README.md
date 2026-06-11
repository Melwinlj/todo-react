# ✦ Tasky — To-Do App (Rebuilt)

A full-stack To-Do application with a properly structured React frontend (Vite) and Python Flask backend. This is a multi-file rewrite of the original single-`index.html` project, integrated with a fully automated CI/CD pipeline powered by Jenkins and AWS S3.

---

## 📁 Project Structure

```
todo-app/
├── frontend/
│   ├── index.html                   # Vite entry HTML
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # React entry point
│       ├── App.jsx                  # Root component (state + API calls)
│       ├── data/
│       │   └── todos.json           # Seed / fallback data
│       ├── components/
│       │   ├── Header.jsx           # Title + stats bar
│       │   ├── TodoForm.jsx         # Add-task form (expandable)
│       │   ├── FilterBar.jsx        # Status + category filters
│       │   ├── TodoList.jsx         # Renders the list
│       │   └── TodoItem.jsx         # Single task row
│       └── styles/
│           ├── global.css           # CSS variables, reset, body
│           ├── Header.css
│           ├── TodoForm.css
│           ├── FilterBar.css
│           ├── TodoList.css
│           └── TodoItem.css
├── backend/
│   ├── app.py                       # Flask app + SQLAlchemy models + routes
│   ├── todos.json                   # Seed data (loaded on first run)
│   ├── requirements.txt
│   └── Dockerfile
├── Jenkinsfile                      # Declarative pipeline definition
└── docker-compose.yml
```

---

## 🚀 Features

- Add tasks with title, description, priority (low/medium/high), and category
- Mark tasks complete / incomplete
- Delete tasks with smooth animation
- Filter by status (All / Open / Done) and category
- Stats counter (Total / Open / Done) in the header
- **Offline-first**: frontend falls back to `todos.json` if the backend is unavailable
- Optimistic UI updates — no loading spinners on actions

---

## 🛠 Tech Stack

| Layer     | Technology                                  |
| --------- | ------------------------------------------- |
| Frontend  | React 18, Vite, CSS Modules (per-component) |
| Backend   | Python 3.11, Flask, Flask-SQLAlchemy        |
| Database  | PostgreSQL (Railway) / SQLite (local dev)   |
| Seed      | `todos.json` (both frontend & backend)      |
| CI/CD     | Jenkins (GitHub Webhook trigger)            |
| Artifacts | AWS S3 (versioned, build-numbered)          |

---

## ⚙️ CI/CD Pipeline — Jenkins + AWS S3

### Overview

Every `git push` to the `master` branch automatically triggers a Jenkins pipeline via a **GitHub Webhook**. The pipeline builds the project, archives the artifact with an incremental build number, and uploads it to an **AWS S3 bucket** — allowing you to retrieve and deploy any specific version at any time.

```
git push → GitHub Webhook → Jenkins Pipeline → Build → Upload to S3 (build #N)
```

---

### 🔗 GitHub Webhook Setup

1. Go to your GitHub repository → **Settings** → **Webhooks** → **Add webhook**
2. Set the **Payload URL** to:
   ```
   http://<your-jenkins-host>:<port>/github-webhook/
   ```
3. Set **Content type** to `application/json`
4. Select **Just the push event**
5. Ensure the webhook is **Active** and save

In Jenkins, make sure the job has **GitHub hook trigger for GITScm polling** enabled under *Build Triggers*.

---

### 🧱 Jenkinsfile

Place this `Jenkinsfile` at the root of the repository:

```groovy
pipeline {
    agent any

    environment {
        S3_BUCKET     = 'your-s3-bucket-name'
        APP_NAME      = 'tasky-todo-app'
        AWS_REGION    = 'ap-south-1'
        BUILD_ARCHIVE = "${APP_NAME}-build-${BUILD_NUMBER}.tar.gz"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Archive Artifact') {
            steps {
                sh '''
                    tar -czf ${BUILD_ARCHIVE} -C frontend/dist .
                    echo "Build #${BUILD_NUMBER} archived as ${BUILD_ARCHIVE}"
                '''
            }
        }

        stage('Upload to S3') {
            steps {
                withAWS(credentials: 'aws-s3-credentials', region: "${AWS_REGION}") {
                    s3Upload(
                        bucket: "${S3_BUCKET}",
                        path: "builds/${BUILD_ARCHIVE}",
                        file: "${BUILD_ARCHIVE}"
                    )
                }
                echo "Artifact uploaded to s3://${S3_BUCKET}/builds/${BUILD_ARCHIVE}"
            }
        }

        stage('Update Build Index') {
            steps {
                withAWS(credentials: 'aws-s3-credentials', region: "${AWS_REGION}") {
                    sh """
                        echo "${BUILD_NUMBER}=${BUILD_ARCHIVE}" >> build-index.txt
                        aws s3 cp build-index.txt s3://${S3_BUCKET}/build-index.txt
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Build #${BUILD_NUMBER} successfully uploaded to S3."
        }
        failure {
            echo "❌ Pipeline failed. Check the Jenkins console for details."
        }
    }
}
```

---

### 🪣 AWS S3 Artifact Storage

All build artifacts are stored in S3 with the naming convention:

```
s3://your-s3-bucket-name/builds/tasky-todo-app-build-<BUILD_NUMBER>.tar.gz
```

A `build-index.txt` file is maintained in the same bucket to track every build:

```
1=tasky-todo-app-build-1.tar.gz
2=tasky-todo-app-build-2.tar.gz
3=tasky-todo-app-build-3.tar.gz
...
```

This allows you to identify and retrieve any specific version at any time.

---

### 🔁 Downloading & Deploying a Specific Build

To download a specific build by number, use the AWS CLI:

```bash
# Download build #5
aws s3 cp s3://your-s3-bucket-name/builds/tasky-todo-app-build-5.tar.gz .

# Extract and serve
mkdir -p deploy && tar -xzf tasky-todo-app-build-5.tar.gz -C deploy/
```

To list all available builds:

```bash
aws s3 ls s3://your-s3-bucket-name/builds/
```

To view the full build index:

```bash
aws s3 cp s3://your-s3-bucket-name/build-index.txt - | cat
```

---

### 🔐 Jenkins AWS Credentials Setup

1. In Jenkins, go to **Manage Jenkins** → **Manage Credentials**
2. Add a new credential of type **AWS Credentials**
3. Set the ID as `aws-s3-credentials`
4. Enter your **AWS Access Key ID** and **Secret Access Key**

> ⚠️ Ensure the IAM user/role has `s3:PutObject`, `s3:GetObject`, and `s3:ListBucket` permissions on the target bucket.

---

### 📋 Required Jenkins Plugins

| Plugin | Purpose |
| --- | --- |
| [GitHub plugin](https://plugins.jenkins.io/github/) | Webhook trigger on push |
| [Pipeline AWS Steps](https://plugins.jenkins.io/pipeline-aws/) | `s3Upload`, `withAWS` steps |
| [AWS Credentials Plugin](https://plugins.jenkins.io/aws-credentials/) | Store AWS keys securely |

---

## 🔧 Local Development

### Option A — Docker Compose (recommended)

```bash
git clone <repo>
cd todo-app
docker-compose up
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:5000>

### Option B — Manual

**Backend**

```bash
cd backend
pip install -r requirements.txt
python app.py          # starts on :5000, seeds DB from todos.json
```

**Frontend**

```bash
cd frontend
npm install
npm run dev            # starts on :3000, proxies /todos → :5000
```

---

## 📌 Environment Variables

| Variable         | Description                        | Default                 |
| ---------------- | ---------------------------------- | ----------------------- |
| `DATABASE_URL`   | PostgreSQL connection string       | SQLite (`todos.db`)     |
| `VITE_API_URL`   | Backend base URL (set in frontend) | `http://localhost:5000` |
| `S3_BUCKET`      | Target S3 bucket for artifacts     | —                       |
| `AWS_REGION`     | AWS region for S3 bucket           | `ap-south-1`            |

---

