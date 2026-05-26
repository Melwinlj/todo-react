pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'   // must match the name set in Manage Jenkins → Tools
    }

    environment {
        APP_NAME      = "myapp"
        BUILDS_BUCKET = "myappbuilds-bucket"
        DEPLOY_BUCKET = "react-on-aws-demo-alessandromarinoac"
        AWS_REGION    = "ap-south-1"
        VERSION_TAG   = "v${env.BUILD_NUMBER}"
        ZIP_NAME      = "${APP_NAME}-v${env.BUILD_NUMBER}.zip"
    }

    triggers {
        githubPush()
        pollSCM('* * * * *')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                cleanWs()
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/master']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Melwinlj/todo-react.git',
                        credentialsId: 'github-credentials'
                    ]],
                    extensions: [[$class: 'CloneOption', shallow: true, depth: 1]]
                ])
                echo "✅ Checked out commit: ${env.GIT_COMMIT?.take(7)}"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Node: $(node -v)  NPM: $(npm -v)"
                    npm ci
                '''
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                echo "✅ Build complete – artifact in build/"
            }
            post {
                failure {
                    error "❌ Build failed – aborting pipeline."
                }
            }
        }

        stage('Package') {
            steps {
                sh """
                    zip -r ${ZIP_NAME} build/
                    echo "✅ Created ${ZIP_NAME}"
                    ls -lh ${ZIP_NAME}
                """
            }
        }

        stage('Upload to S3 Builds Bucket') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh """
                        aws s3 cp ${ZIP_NAME} \
                            s3://${BUILDS_BUCKET}/${ZIP_NAME} \
                            --region ${AWS_REGION}

                        echo "✅ Uploaded ${ZIP_NAME} → s3://${BUILDS_BUCKET}/"
                    """
                }
            }
        }

        stage('Deploy to Static Hosting Bucket') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials',
                    accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                    secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                ]]) {
                    sh """
                        # Download the versioned zip from S3 builds bucket
                        aws s3 cp \
                            s3://${BUILDS_BUCKET}/${ZIP_NAME} \
                            . \
                            --region ${AWS_REGION}

                        echo "✅ Downloaded ${ZIP_NAME} from S3"

                        # Unzip into a clean temp folder
                        rm -rf deploy_tmp
                        mkdir deploy_tmp
                        unzip -q ${ZIP_NAME} -d deploy_tmp/

                        # Sync to static hosting bucket
                        aws s3 sync --delete \
                            deploy_tmp/build/ \
                            s3://${DEPLOY_BUCKET} \
                            --region ${AWS_REGION}

                        echo "✅ Deployed ${VERSION_TAG} → s3://${DEPLOY_BUCKET}"

                        # Cleanup
                        rm -rf deploy_tmp ${ZIP_NAME}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 SUCCESS — ${APP_NAME} ${VERSION_TAG} deployed to s3://${DEPLOY_BUCKET}"
        }
        failure {
            echo "❌ FAILED — check console output above for the broken stage."
        }
        always {
            cleanWs()
        }
    }
}
