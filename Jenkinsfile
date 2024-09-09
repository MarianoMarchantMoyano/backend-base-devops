pipeline {
    agent any

    environment {
        USER = 'Desconocido'
        API_KEY = 'Desconocida'
    }
    
    options {
        disableConcurrentBuilds()
    }

    stages {
        stage('Build and test') {
            agent {
                docker {
                    image 'node:20.11.1-alpine3.19' 
                    reuseNode true
                }
            }
            steps {
                stage('Instalar dependencias') {
                    sh 'npm install'
                }
                stage('ejecucion de test') {
                    sh 'npm run test'
                }
                stage('ejecucion de build') {
                    sh 'npm run build'
                }
            }
        }

        stage('Code Quality') {
            parallel {
                stage('SonarQube analysis') {
                    agent {
                        docker {
                            image 'sonarsource/sonar-scanner-cli' 
                            args '--network="devops-infra_default"'
                            reuseNode true
                        }
                    }
                    steps {
                        withSonarQubeEnv('sonarqube') {
                            sh 'sonar-scanner'
                        }
                    }
                }

                stage('Quality Gate') {
                    steps {
                        timeout(time: 10, unit: 'SECONDS') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }
        }

        stage('delivery') {
            steps {
                script {
                    docker.withRegistry('http://localhost:5001', 'nexus-key') {
                        sh 'docker build -t backend-base-devops:latest .'
                        sh "docker tag backend-base-devops:latest localhost:5001/backend-base-devops:latest"
                        sh "docker tag backend-base-devops:latest localhost:5001/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                        sh 'docker push localhost:5001/backend-base-devops:latest'
                        sh "docker push localhost:5001/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('deploy') {
            steps {
                script {
                    def ambiente = (env.BRANCH_NAME == 'backend-base-devops') ? 'prd' : 'dev'
                    docker.withRegistry('http://localhost:5001', 'nexus-key') {
                        withCredentials([file(credentialsId: "${ambiente}-env", variable: 'ENV_FILE')]) {
                            writeFile file: '.env', text: readFile(ENV_FILE)
                            sh "docker compose pull"
                            sh "docker compose --env-file .env up -d --force-recreate"
                        }
                    }
                }
            }
        }

        stage('Update Kubernetes Deployment') {
            steps {
                script {
                    // Descargar e instalar kubectl
                    sh 'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"'
                    sh 'chmod +x kubectl'
                    sh 'mv kubectl /usr/local/bin/'

                    // Actualizar la imagen del deployment en Kubernetes
                    sh "kubectl set image deployment/backend-base backend-base=localhost:8082/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER} --record"
                }
            }
        }
    }
}
