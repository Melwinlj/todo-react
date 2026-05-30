pipeline {
    agent any

    /* ═══════════════════════════════════════════════════════════════
       CHANGE ONLY THESE VALUES — everything else is auto-derived
       ═══════════════════════════════════════════════════════════════ */
    environment {
        AWS_REGION     = 'ap-south-1'
        BUILDS_BUCKET  = 'myappbuilds-bucket'
        HOSTING_BUCKET = 'react-on-aws-demo-alessandromarinoac'
        APP_DIR        = 'frontend'
        APP_NAME       = 'myapp'
        ZIP_NAME       = "${APP_NAME}-v${BUILD_NUMBER}.zip"

        // ── Fix: make node/npm/aws visible to Jenkins on macOS ──────
        // Jenkins on Mac runs as a daemon and doesn't load ~/.zshrc
        // so we add all common install locations to PATH manually.
        PATH = "/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/sbin:${HOME}/.nvm/versions/node/$(ls ${HOME}/.nvm/versions/node 2>/dev/null | sort -V | tail -1)/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH}"
    }

    triggers {
        githubPush()
    }

    parameters {
        string(
            name:         'DEPLOY_VERSION',
            defaultValue: '',
            description:  'Leave blank = deploy this build. Set e.g. "5" to redeploy build #5.'
        )
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    // ──────────────────────────────────────────────────────────────
    stages {

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 1 — Verify tooling                               │
        // │  Catches missing node/npm/aws BEFORE wasting time       │
        // └─────────────────────────────────────────────────────────┘
        stage('Verify Tools') {
            steps {
                sh '''
                    echo "=== Environment check ==="
                    echo "PATH: $PATH"
                    echo ""

                    # node
                    if command -v node >/dev/null 2>&1; then
                        echo "✅ node  : $(node --version)"
                    else
                        echo "❌ node  : NOT FOUND"
                        echo ""
                        echo "FIX: install Node on this machine then run:"
                        echo "  sudo launchctl setenv PATH \\"\\$PATH:\\$(dirname \\$(which node))\\"  # macOS"
                        echo "  sudo systemctl restart jenkins                                      # Linux"
                        exit 1
                    fi

                    # npm
                    if command -v npm >/dev/null 2>&1; then
                        echo "✅ npm   : $(npm --version)"
                    else
                        echo "❌ npm   : NOT FOUND"
                        exit 1
                    fi

                    # aws
                    if command -v aws >/dev/null 2>&1; then
                        echo "✅ aws   : $(aws --version)"
                    else
                        echo "❌ aws   : NOT FOUND"
                        echo "FIX: brew install awscli   OR   pip3 install awscli"
                        exit 1
                    fi

                    # zip
                    if command -v zip >/dev/null 2>&1; then
                        echo "✅ zip   : $(zip --version | head -1)"
                    else
                        echo "❌ zip   : NOT FOUND"
                        exit 1
                    fi
                '''
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 2 — Checkout   (uses YOUR actual cred ID)        │
        // └─────────────────────────────────────────────────────────┘
        stage('Checkout') {
            steps {
                echo '══> Checking out source code'
                git(
                    url:           'https://github.com/Melwinlj/todo-react.git',
                    branch:        'main',
                    credentialsId: 'github_creds'        // ← matches your Jenkins credential ID
                )
                sh 'ls -la'
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 3 — cd myapp   (screenshot line 6)               │
        // └─────────────────────────────────────────────────────────┘
        stage('cd myapp') {
            steps {
                echo "══> Entering directory: ${APP_DIR}"
                dir("${APP_DIR}") {
                    sh '''
                        echo "pwd  : $(pwd)"
                        echo "node : $(node --version)"
                        echo "npm  : $(npm  --version)"
                        ls -la
                    '''
                }
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 4 — npm install   (screenshot line 7)            │
        // └─────────────────────────────────────────────────────────┘
        stage('npm install') {
            steps {
                echo '══> Installing npm dependencies'
                dir("${APP_DIR}") {
                    sh 'npm install --no-audit --no-fund'
                }
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 5 — npm run build   (screenshot line 8)          │
        // └─────────────────────────────────────────────────────────┘
        stage('npm run build') {
            steps {
                echo '══> Building React / Vite app'
                dir("${APP_DIR}") {
                    sh '''
                        npm run build
                        echo "── build output ──"
                        ls -lh dist/ 2>/dev/null || ls -lh build/ 2>/dev/null || (echo "ERROR: no dist/ or build/ found" && exit 1)
                    '''
                }
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 6 — zip   (screenshot line 9)                    │
        // │   zip -r myapp-vN.zip build/                            │
        // └─────────────────────────────────────────────────────────┘
        stage('zip build artifact') {
            steps {
                echo "══> Creating ${ZIP_NAME}"
                dir("${APP_DIR}") {
                    sh '''
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

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 7 — upload to S3 builds bucket   (line 10)       │
        // └─────────────────────────────────────────────────────────┘
        stage('upload to S3 builds bucket') {
            steps {
                echo "══> Uploading ${ZIP_NAME} → s3://${BUILDS_BUCKET}"
                withCredentials([[
                    $class:            'AmazonWebServicesCredentialsBinding',
                    credentialsId:     'aws-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh '''
                        aws s3 cp "${ZIP_NAME}" \
                            "s3://${BUILDS_BUCKET}/${ZIP_NAME}" \
                            --region "${AWS_REGION}"

                        echo "── Builds bucket contents ──"
                        aws s3 ls "s3://${BUILDS_BUCKET}/" --region "${AWS_REGION}" | tail -20
                    '''
                }
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 8 — Deploy   (screenshot lines 12-16)            │
        // │   - take input of version number        (line 13)        │
        // │   - download version zip                (line 14)        │
        // │   - unzip                               (line 15)        │
        // │   - aws s3 sync --delete → hosting      (line 16)        │
        // └─────────────────────────────────────────────────────────┘
        stage('deploy to S3 hosting') {
            steps {
                script {
                    // Line 13: take input of version number
                    def version = params.DEPLOY_VERSION?.trim()
                    if (!version || version == '') {
                        echo "No DEPLOY_VERSION set — deploying THIS build: v${BUILD_NUMBER}"
                        version = "${BUILD_NUMBER}"
                    } else {
                        echo "Deploying requested version: v${version}"
                    }

                    def zipToFetch = "${APP_NAME}-v${version}.zip"
                    echo "══> Target zip: ${zipToFetch}"

                    withCredentials([[
                        $class:            'AmazonWebServicesCredentialsBinding',
                        credentialsId:     'aws-credentials',
                        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                    ]]) {
                        sh """
                            # Line 14: download version zip
                            echo "══> Downloading s3://${BUILDS_BUCKET}/${zipToFetch}"
                            aws s3 cp "s3://${BUILDS_BUCKET}/${zipToFetch}" \
                                "./${zipToFetch}" \
                                --region "${AWS_REGION}"

                            # Line 15: unzip
                            echo "══> Unzipping ${zipToFetch}"
                            rm -rf deploy_tmp && mkdir deploy_tmp
                            unzip -q "${zipToFetch}" -d deploy_tmp/
                            ls -lh deploy_tmp/

                            # Auto-detect dist/ or build/ inside the zip
                            STATIC_DIR=\$(find deploy_tmp -maxdepth 1 -type d \\( -name dist -o -name build \\) | head -1)
                            [ -z "\$STATIC_DIR" ] && STATIC_DIR="deploy_tmp"
                            echo "══> Syncing from: \$STATIC_DIR"

                            # Line 16: aws s3 sync --delete to static hosting bucket
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
