pipeline {
    agent any
    
    environment {
        USERNAME = 'cmd'
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
                agent any
            }
        }
    }

    environment {
        SONARQUBE_URL = 'http://localhost:8084/'
        NEXUS_URL = 'http://localhost:8081/'
        NEXUS_REPO = 'docker-hosted'
        SONARQUBE_TOKEN = credentials('token-sonar')
        NEXUS_KEY = credentials('nexus-key')
        DOCKER_IMAGE_NAME = 'backend-base-devops'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    // Dependiendo de tu lenguaje y gestor de paquetes
                    sh 'npm install' // Para Node.js
                }
            }
        }

        stage('Testing') {
            steps {
                script {
                    // Ejecuta tus pruebas aquí
                    sh 'npm test'
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    // Construye tu aplicación
                    sh 'npm run build'
                }
            }
        }

        stage('Upload Quality Report to SonarQube') {
            steps {
                script {
                    // Ejecuta el análisis de SonarQube
                    sh "sonar-scanner -Dsonar.projectKey=${env.JOB_NAME} -Dsonar.sources=. -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_TOKEN}"
                }
            }
        }

        stage('Quality Gate Validation') {
            steps {
                script {
                    // Espera hasta que el análisis de SonarQube complete y verifica la puerta de calidad
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Construye la imagen Docker
                    sh "docker build -t ${DOCKER_IMAGE_NAME}:latest ."
                }
            }
        }

        stage('Upload Image to Nexus') {
            steps {
                script {
                    // Log in to Docker registry (Nexus)
                    sh "echo ${NEXUS_KEY} | docker login ${NEXUS_URL} --username admin --password-stdin"
                    
                    // Tag and push the Docker image to Nexus
                    sh "docker tag ${DOCKER_IMAGE_NAME}:latest ${NEXUS_URL}/${NEXUS_REPO}/${DOCKER_IMAGE_NAME}:latest"
                    sh "docker push ${NEXUS_URL}/${NEXUS_REPO}/${DOCKER_IMAGE_NAME}:latest"
                }
            }
        }
    }

    post {
        always {
            // Opcional: limpiar recursos, enviar notificaciones, etc.
            cleanWs()
        }
    }
}
