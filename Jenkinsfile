pipeline {
    agent any

    /* ═══════════════════════════════════════════════════════════════
       CHANGE ONLY THESE 4 VALUES — everything else is auto-derived
       ═══════════════════════════════════════════════════════════════ */
    environment {
        AWS_REGION     = 'ap-south-1'
        BUILDS_BUCKET  = 'myappbuilds-bucket'
        HOSTING_BUCKET = 'react-on-aws-demo-alessandromarinoac'
        APP_DIR        = 'frontend'
        APP_NAME       = 'myapp'
        ZIP_NAME       = "${APP_NAME}-v${BUILD_NUMBER}.zip"
    }

    /* ═══════════════════════════════════════════════════════
       Auto-trigger on every push  (requires GitHub webhook)
       ═══════════════════════════════════════════════════════ */
    triggers {
        githubPush()
    }

    /* ═══════════════════════════════════════════════════════
       Optional: re-deploy any old version without rebuilding
       ═══════════════════════════════════════════════════════ */
    parameters {
        string(
            name:         'DEPLOY_VERSION',
            defaultValue: '',
            description:  'Leave blank = deploy this build. Set to e.g. "5" to redeploy build #5.'
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
        // │  STAGE 1 — Checkout                                     │
        // └─────────────────────────────────────────────────────────┘
        stage('Checkout') {
            steps {
                echo '══> Checking out source code'
                git(
                    url:           'https://github.com/Melwinlj/todo-react.git',
                    branch:        'main',
                    credentialsId: 'github-credentials'
                )
                sh 'ls -la'
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 2 — cd myapp   (screenshot line 6)               │
        // └─────────────────────────────────────────────────────────┘
        stage('cd myapp') {
            steps {
                echo "══> Entering directory: ${APP_DIR}"
                dir("${APP_DIR}") {
                    sh '''
                        echo "pwd        : $(pwd)"
                        echo "node       : $(node  --version 2>/dev/null || echo NOT FOUND)"
                        echo "npm        : $(npm   --version 2>/dev/null || echo NOT FOUND)"
                        echo "aws        : $(aws   --version 2>/dev/null || echo NOT FOUND)"
                        ls -la
                    '''
                }
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 3 — npm install   (screenshot line 7)            │
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
        // │  STAGE 4 — npm run build   (screenshot line 8)          │
        // └─────────────────────────────────────────────────────────┘
        stage('npm run build') {
            steps {
                echo '══> Building React / Vite app'
                dir("${APP_DIR}") {
                    sh '''
                        npm run build
                        echo "── build output ──"
                        ls -lh dist/ 2>/dev/null || ls -lh build/ 2>/dev/null || echo "WARNING: no dist/ or build/ found"
                    '''
                }
            }
        }

        // ┌─────────────────────────────────────────────────────────┐
        // │  STAGE 5 — zip   (screenshot line 9)                    │
        // │   zip -r myapp-vN.zip build/                            │
        // └─────────────────────────────────────────────────────────┘
        stage('zip build artifact') {
            steps {
                echo "══> Creating ${ZIP_NAME}"
                dir("${APP_DIR}") {
                    sh '''
                        # Works for both Vite (dist/) and CRA (build/)
                        if [ -d "dist" ]; then
                            BUILD_DIR="dist"
                        elif [ -d "build" ]; then
                            BUILD_DIR="build"
                        else
                            echo "ERROR: no dist/ or build/ directory found after npm run build"
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
        // │  STAGE 6 — aws s3 sync → builds bucket  (line 10)      │
        // │   aws s3 sync --delete myapp-vN.zip s3://builds-bucket  │
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
        // │  STAGE 7 — Deploy   (screenshot lines 12-16)           │
        // │   - take input of version number        (line 13)       │
        // │   - download version zip                (line 14)       │
        // │   - unzip                               (line 15)       │
        // │   - aws s3 sync --delete → hosting      (line 16)       │
        // └─────────────────────────────────────────────────────────┘
        stage('deploy to S3 hosting') {
            steps {
                script {
                    // ── Line 13: take input of version number ──────────────
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
                            # ── Line 14: download version zip ─────────────────
                            echo "══> Downloading s3://${BUILDS_BUCKET}/${zipToFetch}"
                            aws s3 cp "s3://${BUILDS_BUCKET}/${zipToFetch}" \
                                "./${zipToFetch}" \
                                --region "${AWS_REGION}"

                            # ── Line 15: unzip ────────────────────────────────
                            echo "══> Unzipping ${zipToFetch}"
                            rm -rf deploy_tmp && mkdir deploy_tmp
                            unzip -q "${zipToFetch}" -d deploy_tmp/
                            echo "── unzipped contents ──"
                            ls -lh deploy_tmp/

                            # Detect the static folder (dist/ or build/ or root)
                            STATIC_DIR=\$(find deploy_tmp -maxdepth 1 -type d \\( -name dist -o -name build \\) | head -1)
                            [ -z "\$STATIC_DIR" ] && STATIC_DIR="deploy_tmp"
                            echo "══> Deploying from: \$STATIC_DIR"

                            # ── Line 16: aws s3 sync to static hosting bucket ─
                            aws s3 sync "\$STATIC_DIR" \
                                "s3://${HOSTING_BUCKET}" \
                                --delete \
                                --region "${AWS_REGION}"

                            echo ""
                            echo "✅ Live at: http://${HOSTING_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com"

                            # Tidy up
                            rm -rf deploy_tmp "${zipToFetch}"
                        """
                    }
                }
            }
        }

    } // end stages
    // ──────────────────────────────────────────────────────────────

    post {
        success {
            echo "✅ Pipeline PASSED — Build #${BUILD_NUMBER} deployed to s3://${HOSTING_BUCKET}"
        }
        failure {
            echo "❌ Pipeline FAILED — check the console output above"
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
