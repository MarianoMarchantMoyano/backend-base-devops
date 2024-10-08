pipeline {
    agent any

    environment {
        USER = 'backend-base-devop'
        API_KEY = 'backend-base-devop'
        KUBECONFIG = '/path/to/kubeconfig'
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
                        timeout(time: 3, unit: 'MINUTES') {
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

        //Verificacion de Kubernete! si es necesario

        stage('Check Kubernetes Config') {
            steps {
                script {
                    sh 'cat /home/mariano/.kube/config'
                    sh 'kubectl config view'
                }
            }
        }

 
        stage('Kubernetes Deployment') {
            steps {
                 script {
                     def imageName = "localhost:8082/backend-base-devops-${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                     echo "Deploying image: ${imageName}"
                     withKubeConfig([credentialsId: 'kubeconfig-id']) {
                         sh "kubectl config view"
                         sh "kubectl set image deployment/backend-base-devops-deployment backend-base-devops=${imageName} -n devops"
                     }
 
                }
            }
        }          
    }
}