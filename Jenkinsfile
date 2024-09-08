pipeline {
    
    agent {
        docker {
            image 'node:16-alpine' // Usa una imagen de Docker con Node.js y npm preinstalados
            args '-v /var/run/docker.sock:/var/run/docker.sock' // Monta el socket de Docker para la etapa de build
        }
    }
    
    environment {
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'backend-base-devops'
        SONAR_LOGIN = credentials('token-sonar-devops') // Credential ID del token de SonarQube
        NEXUS_URL = 'http://localhost:8082'
        NEXUS_REPO = 'docker-hosted'  // Actualiza con el nombre de tu repositorio en Nexus
        DOCKER_IMAGE = 'backend-base-devops'  // Cambia por el nombre de tu imagen
        NEXUS_CREDENTIALS_ID = 'nexus-key'  // Debes configurar las credenciales en Jenkins
        KUBERNETES_DEPLOYMENT = 'backend-app'  // Nombre del deployment definido en el kubernetes.yaml
        KUBERNETES_NAMESPACE = 'default'  // Namespace donde está desplegada la aplicación
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'  // Ajusta según tu gestor de dependencias
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'  // Cambia este comando si utilizas otro framework de testing
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'  // Ajusta según tu script de build
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

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    docker.build("${DOCKER_IMAGE}:${latest}")
                }
            }
        }

        stage('Push Docker Image to Nexus') {
            steps {
                script {
                    docker.withRegistry("${NEXUS_URL}/${NEXUS_REPO}", "${NEXUS_CREDENTIALS_ID}") {
                        def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                        docker.image("${DOCKER_IMAGE}:${latest}").push()
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
