pipeline {
    agent {
        docker {
            image 'node:20.11.1-alpine3.19'
            reuseNode true
        }
    }

    environment {
        SONAR_HOST_URL = 'http://localhost:8084'
        SONAR_LOGIN = credentials('token-sonar')
        SONAR_PROJECT_KEY = 'backend-base-devops'
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_REPO = 'docker-hosted'
        DOCKER_IMAGE = 'backend-base-devops'
        NEXUS_CREDENTIALS_ID = 'nexus-key'
        KUBERNETES_DEPLOYMENT = 'backend-app'
        KUBERNETES_NAMESPACE = 'default'
    }

    stages {
        stage('Check npm') {
            steps {
                sh 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Check Sonar Scanner') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli'
                    args '--network="devops-infra_default"'
                    reuseNode true
                }
            }
            steps {
                sh 'sonar-scanner --version'
            }
        }

        stage('Code Quality') {
            parallel {
                stage('SonarQube Analysis') {
                    agent {
                        docker {
                            image 'sonarsource/sonar-scanner-cli'
                            args '--network="devops-infra_default"'
                            reuseNode true
                        }
                    }
                    steps {
                        waitForQualityGate('sonarqube')
                            sh 'sonar-scanner'
                }

                stage('Quality Gate') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    docker.build("${DOCKER_IMAGE}:${appVersion}")
                }
            }
        }

        stage('Push Docker Image to Nexus') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    docker.withRegistry("${NEXUS_URL}", "${NEXUS_CREDENTIALS_ID}") {
                        docker.image("${DOCKER_IMAGE}:${appVersion}").push()
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    sh """
                    kubectl set image deployment/${KUBERNETES_DEPLOYMENT} \
                    ${KUBERNETES_DEPLOYMENT}=${DOCKER_IMAGE}:${appVersion} \
                    --namespace=${KUBERNETES_NAMESPACE}
                    kubectl rollout status deployment/${KUBERNETES_DEPLOYMENT} --namespace=${KUBERNETES_NAMESPACE}
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def ambiente = env.BRANCH_NAME == 'main' ? 'prd' : 'dev'
                    docker.withRegistry('http://localhost:8082', 'nexus-key') {
                        withCredentials([file(credentialsId: "${ambiente}-env", variable: 'ENV_FILE')]) {
                            writeFile file: '.env', text: readFile(ENV_FILE)
                            sh "docker compose pull"
                            sh "docker compose --env-file .env up -d --force-recreate"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
