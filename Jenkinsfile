pipeline {
    agent any

    environment {
        USER = 'backend-base-devop'
        API_KEY = 'backend-base-devop'
        KUBECONFIG = '/path/to/your/kubeconfig' // Ajusta esta ruta según sea necesario
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

        //Verificacion de Kubernete!

        stage('Check kubectl') {
            steps {
                sh 'which kubectl || echo "kubectl not found"'
            }
        }

        stage('Install kubectl') {
            agent {
                docker {
                image 'node:20.11.1-alpine3.19' // Cambia esto si usas una imagen diferente
                reuseNode true
            }
            }
            steps {
                sh '''
                curl -LO "https://dl.k8s.io/release/v1.31.0/bin/linux/amd64/kubectl"
                chmod +x ./kubectl
                mv ./kubectl /usr/local/bin/kubectl
                '''
            }
        }

        stage('Check PATH') {
            steps {
                sh 'echo $PATH'
            }
        }

        stage('Kubernetes Deployment') {
            steps {
                 script {
                     def imageName = "localhost:8082/backend-base-devops-${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
                     echo "Deploying image: ${imageName}"
                     withKubeConfig([credentialsId: 'kubeconfig-id']) {
                         sh "kubectl set image deployment backend-base-devops-deployment backend-base-devops=${imageName}"
                     }
 
                }
            }
        }          
    }
}