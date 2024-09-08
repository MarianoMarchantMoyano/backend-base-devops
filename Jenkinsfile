pipeline {
    
    agent {
        docker {
            image 'node:16-alpine' // Usa una imagen de Docker con Node.js y npm preinstalados
            args '-v /var/run/docker.sock:/var/run/docker.sock' // Monta el socket de Docker para la etapa de build
        }
    }
    
    environment {
        SONAR_HOST_URL = 'http://localhost:8084' // Asegúrate de que esta URL es correcta
        SONAR_PROJECT_KEY = 'backend-base-devops'
        SONAR_LOGIN = credentials('token-sonar-devops') // Credential ID del token de SonarQube
        NEXUS_URL = 'http://localhost:8081' // Asegúrate de que esta URL es correcta
        NEXUS_REPO = 'docker-hosted'  // Nombre de tu repositorio en Nexus
        DOCKER_IMAGE = 'backend-base-devops'  // Nombre de tu imagen Docker
        NEXUS_CREDENTIALS_ID = 'nexus-key'  // ID de las credenciales de Nexus en Jenkins
        KUBERNETES_DEPLOYMENT = 'backend-app'  // Nombre del deployment en Kubernetes
        KUBERNETES_NAMESPACE = 'default'  // Namespace en Kubernetes
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'  // Instala las dependencias del proyecto
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'  // Ejecuta las pruebas del proyecto
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'  // Construye el proyecto
            }
        }

        stage('Code Quality') {
            parallel {
                stage('SonarQube Analysis') {
                    agent {
                        docker {
                            image 'sonarsource/sonar-scanner-cli' // Imagen con sonar-scanner preinstalado
                            args '--network="devops-infra_default"' // Asegúrate de que esta red sea la correcta
                            reuseNode true
                        }
                    }
                    steps {
                        withSonarQubeEnv('sonarqube') {
                            sh '''
                            sonar-scanner \
                            -Dsonar.projectKey=$SONAR_PROJECT_KEY \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.login=$SONAR_LOGIN
                            '''
                        }
                    }
                }

                stage('Quality Gate') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    docker.build("${DOCKER_IMAGE}:${appVersion}")
                }
            }
        }

        stage('Push Docker Image to Nexus') {
            steps {
                script {
                    docker.withRegistry("${NEXUS_URL}", "${NEXUS_CREDENTIALS_ID}") {
                        def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                        docker.image("${DOCKER_IMAGE}:${appVersion}").push()
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    sh """
                    kubectl set image deployment/${KUBERNETES_DEPLOYMENT} \
                    ${KUBERNETES_DEPLOYMENT}=${DOCKER_IMAGE}:${appVersion} \
                    --namespace=${KUBERNETES_NAMESPACE}
                    kubectl rollout status deployment/${KUBERNETES_DEPLOYMENT} --namespace=${KUBERNETES_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
