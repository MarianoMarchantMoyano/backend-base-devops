pipeline {
    agent any

    environment {
        USERNAME = 'cmd'
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'backend-base-devops'
        SONAR_LOGIN = credentials('token-sonar-devops') // Credential ID del token de SonarQube
        //NEXUS_REPOSITORY = 'http://localhost:8082'
        //DOCKER_IMAGE_NAME = 'backend-base-devops'
        //DOCKER_REGISTRY_CREDENTIALS = 'nexus-key' // Credential ID de Nexus
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
                script {
                    // Instalar dependencias de Node.js
                    sh 'npm install'
                    // Ejecutar los tests
                    sh 'npm run test'
                    // Ejecutar el build de la aplicación
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube analysis') {
            steps {
                script {
                    // Ejecutar el análisis de SonarQube
                    withSonarQubeEnv('sonarqube') {
                        sh 'sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_LOGIN}'
                    }
                }
            }
        }

        stage('Validación de Puerta de Calidad') {
            steps {
                script {
                    // Validar la calidad del código a través del Quality Gate
                    timeout(time: 1, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('Construcción de imagen Docker') {
            steps {
                script {
                    // Construir la imagen Docker
                    sh 'docker build -t ${DOCKER_IMAGE_NAME}:latest .'
                }
            }
        }

        stage('Subir imagen Docker a Nexus') {
            steps {
                script {
                    // Taggear la imagen para el repositorio Nexus
                    docker.withRegistry("${NEXUS_REPOSITORY}", "${DOCKER_REGISTRY_CREDENTIALS}") {
                        sh "docker tag ${DOCKER_IMAGE_NAME}:latest ${NEXUS_REPOSITORY}/${DOCKER_IMAGE_NAME}:latest"
                        sh "docker tag ${DOCKER_IMAGE_NAME}:latest ${NEXUS_REPOSITORY}/${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}"
                        // Subir la imagen al registry de Nexus
                        sh "docker push ${NEXUS_REPOSITORY}/${DOCKER_IMAGE_NAME}:latest"
                        sh "docker push ${NEXUS_REPOSITORY}/${DOCKER_IMAGE_NAME}:${env.BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Actualizar servicio') {
            steps {
                script {
                    // Desplegar la nueva imagen en el ambiente correspondiente
                    def environmentFile = (env.BRANCH_NAME == 'main') ? 'prd-env' : 'dev-env'

                    docker.withRegistry("${NEXUS_REPOSITORY}", "${DOCKER_REGISTRY_CREDENTIALS}") {
                        withCredentials([file(credentialsId: "${environmentFile}", variable: 'ENV_FILE')]) {
                            // Actualizar el entorno con la nueva imagen
                            writeFile file: '.env', text: readFile(ENV_FILE)
                            sh 'docker compose pull'
                            sh 'docker compose up -d --force-recreate'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            // Limpieza
            cleanWs()
        }
        success {
            echo 'Pipeline ejecutado correctamente'
        }
        failure {
            echo 'Hubo un error en la ejecución del pipeline'
        }
    }
}
