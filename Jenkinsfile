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

        stage('Set Up Kubernetes Config') {
            steps {
                 script {
                    // Copiar el archivo de configuración de Kubernetes a un lugar accesible para Jenkins
                    sh 'mkdir -p /root/.kube'
                    sh 'cp /home/mariano/.kube/config /root/.kube/config'
                }
            }
        }


        stage('Update Kubernetes Deployment') {
            steps {
                 script {
                     // Asegúrate de que el contexto esté configurado correctamente
                     sh 'kubectl config use-context minikube'
                     // Actualizar la imagen del deployment en Kubernetes
                     sh "kubectl set image deployment/backend-base-devops backend-base-devops=localhost:8082/backend-base-devops:${env.BRANCH_NAME}-${env.BUILD_NUMBER} --record"
 
                }
            }
        }          
    }
}