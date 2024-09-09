pipeline {
    agent any

    environment {
        USER = 'backend-base-devop'
        API_KEY = 'backend-base-devop'
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
                     // Descargar e instalar kubectl
                     sh 'curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"'
                     sh 'chmod +x kubectl'
                     sh 'mv kubectl /usr/local/bin/'

                     // Configurar el contexto de kubectl para Minikube   
                     sh 'minikube kubectl -- config use-context minikube'

                     // Verificar el contexto actual de kubectl
                     sh 'kubectl config current-context'

                     // Verificar el estado del deployment antes de actualizar
                     sh 'kubectl get deployment backend-base-devops'

                     // Actualizar la imagen del deployment en Kubernetes
                     sh "kubectl set image deployment/backend-base-devops backend-base-devops=localhost:8082/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                     
                     // Verificar el estado del deployment después de actualizar
                     sh 'kubectl get deployment backend-base-devops'
                }
            }
        }          
    }
}