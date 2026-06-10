pipeline {
    agent any

    environment {
        AWS_REGION     = 'ap-south-1'
        BUILDS_BUCKET  = 'to-dooo'
        HOSTING_BUCKET = 'to-dooo'
        APP_DIR        = 'frontend'
        APP_NAME       = 'myapp'
        ZIP_NAME       = "${APP_NAME}-v${BUILD_NUMBER}.zip"
    }

    triggers {
        githubPush()
    }

    parameters {
        string(
            name:         'DEPLOY_VERSION',
            defaultValue: '',
            description:  'Leave blank = deploy this build. Set e.g. 5 to redeploy build #5.'
        )
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // ─────────────────────────────────────────────
        // STAGE 1 — Verify Tools
        // ─────────────────────────────────────────────
        stage('Verify Tools') {
            steps {
                sh '''
                    export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

                    NVM_NODE_DIR="$HOME/.nvm/versions/node"
                    if [ -d "$NVM_NODE_DIR" ]; then
                        LATEST_NODE=$(ls "$NVM_NODE_DIR" | sort -V | tail -1)
                        export PATH="$NVM_NODE_DIR/$LATEST_NODE/bin:$PATH"
                    fi

                    MISSING=0
                    command -v node >/dev/null 2>&1 && echo "✅ node : $(node --version)" || { echo "❌ node NOT FOUND"; MISSING=1; }
                    command -v npm  >/dev/null 2>&1 && echo "✅ npm  : $(npm  --version)" || { echo "❌ npm  NOT FOUND"; MISSING=1; }
                    command -v aws  >/dev/null 2>&1 && echo "✅ aws  : $(aws  --version)" || { echo "❌ aws  NOT FOUND"; MISSING=1; }
                    command -v zip  >/dev/null 2>&1 && echo "✅ zip  : found"             || { echo "❌ zip  NOT FOUND"; MISSING=1; }
                    [ "$MISSING" = "1" ] && exit 1 || echo "All tools found ✅"
                '''
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 2 — Checkout
        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '══> Checking out source code'
                git(
                    url:           'https://github.com/Melwinlj/todo-react.git',
                    branch:        'main',
                    credentialsId: 'github_creds'
                )
                sh 'ls -la'
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 3 — cd myapp  (screenshot line 6)
        // ─────────────────────────────────────────────
        stage('cd myapp') {
            steps {
                echo "══> Entering directory: ${APP_DIR}"
                dir("${APP_DIR}") {
                    sh '''
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
                        echo "pwd  : $(pwd)"
                        echo "node : $(node --version)"
                        echo "npm  : $(npm  --version)"
                        ls -la
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 4 — npm install  (screenshot line 7)
        // ─────────────────────────────────────────────
        stage('npm install') {
            steps {
                echo '══> Installing npm dependencies'
                dir("${APP_DIR}") {
                    sh '''
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
                        npm install --no-audit --no-fund
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 5 — npm run build  (screenshot line 8)
        // ─────────────────────────────────────────────
        stage('npm run build') {
            steps {
                echo '══> Building React / Vite app'
                dir("${APP_DIR}") {
                    sh '''
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
                        npm run build
                        echo "── build output ──"
                        ls -lh dist/ 2>/dev/null || ls -lh build/ 2>/dev/null || (echo "ERROR: no dist/ or build/ folder" && exit 1)
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 6 — zip  (screenshot line 9)
        // ─────────────────────────────────────────────
        stage('zip build artifact') {
            steps {
                echo "══> Creating ${ZIP_NAME}"
                dir("${APP_DIR}") {
                    sh '''
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"

                        if [ -d "dist" ]; then
                            BUILD_DIR="dist"
                        elif [ -d "build" ]; then
                            BUILD_DIR="build"
                        else
                            echo "ERROR: no dist/ or build/ directory found"
                            exit 1
                        fi

                        echo "Zipping ${BUILD_DIR}/ → ../${ZIP_NAME}"
                        zip -r "../${ZIP_NAME}" "${BUILD_DIR}/"
                        echo "Zip size: $(du -sh ../${ZIP_NAME} | cut -f1)"
                    '''
                }
                archiveArtifacts artifacts: "${ZIP_NAME}", fingerprint: true
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 7 — Upload to S3 builds bucket (line 10)
        // Uses plain Secret Text credentials —
        // NO "AWS Credentials" plugin required
        // ─────────────────────────────────────────────
        stage('upload to S3 builds bucket') {
            steps {
                echo "══> Uploading ${ZIP_NAME} → s3://${BUILDS_BUCKET}"
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
                        export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
                        export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
                        export AWS_DEFAULT_REGION="$AWS_REGION"

                        aws s3 cp "${ZIP_NAME}" \
                            "s3://${BUILDS_BUCKET}/${ZIP_NAME}" \
                            --region "${AWS_REGION}"

                        echo "── Builds bucket contents ──"
                        aws s3 ls "s3://${BUILDS_BUCKET}/" --region "${AWS_REGION}" | tail -20
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 8 — Deploy  (screenshot lines 12-16)
        //   line 13 — take input of version number
        //   line 14 — download version zip
        //   line 15 — unzip
        //   line 16 — aws s3 sync --delete to hosting
        // ─────────────────────────────────────────────
        stage('deploy to S3 hosting') {
            steps {
                script {
                    // line 13 — take input of version number
                    def version = params.DEPLOY_VERSION?.trim()
                    if (!version || version == '') {
                        echo "No DEPLOY_VERSION set — deploying THIS build: v${BUILD_NUMBER}"
                        version = "${BUILD_NUMBER}"
                    } else {
                        echo "Deploying requested version: v${version}"
                    }

                    def zipToFetch = "${APP_NAME}-v${version}.zip"
                    echo "══> Target zip: ${zipToFetch}"

                    withCredentials([
                        string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                    ]) {
                        sh """
                            export PATH="/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:\$PATH"
                            export AWS_ACCESS_KEY_ID="\$AWS_ACCESS_KEY_ID"
                            export AWS_SECRET_ACCESS_KEY="\$AWS_SECRET_ACCESS_KEY"
                            export AWS_DEFAULT_REGION="${AWS_REGION}"

                            # line 14 — download version zip
                            echo "══> Downloading s3://${BUILDS_BUCKET}/${zipToFetch}"
                            aws s3 cp "s3://${BUILDS_BUCKET}/${zipToFetch}" \
                                "./${zipToFetch}" \
                                --region "${AWS_REGION}"

                            # line 15 — unzip
                            echo "══> Unzipping ${zipToFetch}"
                            rm -rf deploy_tmp && mkdir deploy_tmp
                            unzip -q "${zipToFetch}" -d deploy_tmp/
                            ls -lh deploy_tmp/

                            # detect dist/ or build/ inside the zip
                            STATIC_DIR=\$(find deploy_tmp -maxdepth 1 -type d \\( -name dist -o -name build \\) | head -1)
                            [ -z "\$STATIC_DIR" ] && STATIC_DIR="deploy_tmp"
                            echo "══> Syncing from: \$STATIC_DIR"

                            # line 16 — aws s3 sync --delete to hosting bucket
                            aws s3 sync "\$STATIC_DIR" \
                                "s3://${HOSTING_BUCKET}" \
                                --delete \
                                --region "${AWS_REGION}"

                            echo ""
                            echo "✅ Live at: http://${HOSTING_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com"

                            rm -rf deploy_tmp "${zipToFetch}"
                        """
                    }
                }
            }
        }

    } // end stages

    post {
        success {
            echo "✅ Pipeline PASSED — Build #${BUILD_NUMBER} deployed to s3://${HOSTING_BUCKET}"
        }
        failure {
            echo "❌ Pipeline FAILED — check console output above"
        }
        always {
            cleanWs(
                cleanWhenSuccess: true,
                cleanWhenFailure: false,
                cleanWhenAborted: true
            )
        }
    }
}
