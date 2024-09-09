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
            stages {
               stage('Instalar dependencias') {
                   steps {
                       sh 'npm install'
                   }
               } 
                stage('ejecucion de test') {
                   steps {
                       sh 'npm run test'
                   }
               } 
                stage('ejecucion de build') {
                   steps {
                       sh 'npm run build'
                   }
               } 
            }
        }
        stage('Code Quality'){
            stages {
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
        stage('delivery'){
            steps {
                script {
                    docker.withRegistry('http://localhost:8082', 'nexus-key') {
                        sh 'docker build -t backend-base-devops:latest .'
                        sh "docker tag backend-base-devops:latest localhost:8082/backend-base-devops:latest"
                        sh "docker tag backend-base-devops:latest localhost:8082/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                        sh 'docker push localhost:8082/backend-base-devops:latest'
                        sh "docker push localhost:8082/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                    }
                }
            }
        }
        stage('deploy'){
             steps {
                 script {
                     if (env.BRANCH_NAME == 'backend-base-devops') {
                         ambiente = 'prd'
                     } else {
                         ambiente = 'dev'
                     }
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
        stage('Update Kubernetes Deployment') {
            steps {
                script {
                    // Comando para actualizar la imagen del deployment en Kubernetes
                    sh "kubectl set image deployment/backend-base backend-base=localhost:8082/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER} --record"
                }
            }
        }
    }
}
