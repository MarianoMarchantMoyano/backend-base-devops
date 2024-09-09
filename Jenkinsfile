pipeline {
    agent any
    environment {
        USERNAME = 'admin'
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
                stage('SonarQube Analisis') {
                    agent {
                        docker {
                            image 'sonarsource/sonar-scanner-cli' 
                            args '--network="backend-base-devops_default"'
                            reuseNode true
                        }
                    }
                    steps {
                        withSonarQubeEnv('sonarqube') {
                            sh 'sonar-scanner'
                        }
                    }
                }
             
            }
        }
        stage('Delivery'){
            steps {
                script {
                    docker.withRegistry('http://localhost:8081', 'nexus-key') {
                        sh 'docker build -t backend-base-devops:latest .'
                        sh "docker tag backend-base:latest localhost:8081/backend-base-devops:latest"
                        sh 'docker push localhost:8081/backend-base-devops:latest'
                        
                    }
                }
            }
        }
        stage('Deploy'){
            steps {
                script {
                    
                    if (env.BRANCH_NAME == 'main') {
                        ambiente = 'prdd'
                    } else {
                        ambiente = 'dev'
                    }
                    docker.withRegistry('http://localhost:8081', 'nexus-key') {
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
}