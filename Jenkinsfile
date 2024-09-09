pipeline {
    agent any

    environment {
        SONAR_URL = 'http://localhost:8084'
        SONARQUBE_TOKEN = credentials('token-sonar')
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_CREDENTIALS = credentials('nexus-key')
        KUBERNETES_NAMESPACE = 'default'
        DOCKER_IMAGE = 'backend-base-devops'
        DOCKER_TAG = 'latest'
    }

    tools {
        nodejs "NodeJS"  // El nombre de la herramienta definida en Jenkins
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm run test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    timeout(time: 1, unit: 'HOURS') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .'
            }
        }

        stage('Push to Nexus') {
            steps {
                script {
                    docker.withRegistry("${NEXUS_URL}", "${NEXUS_CREDENTIALS}") {
                        sh 'docker push ${DOCKER_IMAGE}:${DOCKER_TAG}'
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl set image deployment/backend-deployment backend=${DOCKER_IMAGE}:${DOCKER_TAG} --namespace=${KUBERNETES_NAMESPACE}'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}