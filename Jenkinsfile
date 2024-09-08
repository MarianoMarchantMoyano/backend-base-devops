pipeline {
    
    agent {
        docker {
            image 'node:20.11.1-alpine3.19'
            reuseNode true
        }
    }

    environment {
        // Definir las variables de entorno necesarias
        SONARQUBE_URL = 'http://localhost:8084'
        NEXUS_URL = 'http://localhost:8081'
        DOCKER_REGISTRY = "${NEXUS_URL}/repository/docker-hosted/"
        DOCKER_CREDENTIALS_ID = 'nexus-key'
        SONARQUBE_CREDENTIALS_ID = 'token-sonar'
        KUBERNETES_DEPLOYMENT = 'your-kubernetes-deployment' // Reemplaza con tu deployment

    }

    stages {
        stage('Instalar dependencias') {
            steps {
                script {
                    sh 'npm install' // O el comando adecuado para tu proyecto
                }
            }
        }
        
        stage('Testing') {
            steps {
                script {
                    sh 'npm test' // O el comando adecuado para tus pruebas
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    sh 'npm run build' // O el comando adecuado para construir tu proyecto
                }
            }
        }

        stage('Upload de Informe a SonarQube') {
            steps {
                script {
                    withSonarQubeEnv('SonarQube') {
                        sh 'mvn sonar:sonar' // O el comando adecuado para subir el informe a SonarQube
                    }
                }
            }
        }

        stage('Validación de puerta de calidad con SonarQube') {
            steps {
                script {
                    waitForQualityGate abortPipeline: true // Espera a la puerta de calidad y aborta si falla
                }
            }
        }

        stage('Construcción de imagen Docker') {
            steps {
                script {
                    sh 'docker build -t ${DOCKER_REGISTRY}/your-image:latest .' // Reemplaza 'your-image' con tu nombre de imagen
                }
            }
        }

        stage('Upload de imagen al registry de Nexus') {
            steps {
                script {
                    docker.withRegistry("${DOCKER_REGISTRY}", "${DOCKER_CREDENTIALS_ID}") {
                        sh 'docker push ${DOCKER_REGISTRY}/your-image:latest' // Reemplaza 'your-image' con tu nombre de imagen
                    }
                }
            }
        }

        stage('Actualización de imagen en deployment de Kubernetes') {
            steps {
                script {
                    sh 'kubectl set image deployment/${KUBERNETES_DEPLOYMENT} your-container=${DOCKER_REGISTRY}/your-image:latest' // Reemplaza 'your-container' y 'your-image' con los nombres adecuados
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completado con éxito'
        }
        failure {
            echo 'Pipeline fallido'
        }
    }
}
