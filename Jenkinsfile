pipeline {
    agent any

    environment {
        // Define environment variables here if needed
        SONARQUBE_URL = 'http://sonarqube:9000'
        NEXUS_URL = 'http://nexus:8081'
        KUBERNETES_CONTEXT = 'your-kube-context'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    // Replace with your dependency installation command
                    sh 'npm install'
                }
            }
        }

        stage('Testing') {
            steps {
                script {
                    // Replace with your test command
                    sh 'npm test'
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    // Replace with your build command
                    sh 'npm run build'
                }
            }
        }

        stage('Upload SonarQube Report') {
            steps {
                script {
                    // Replace with your SonarQube scanner command
                    sh "sonar-scanner -Dsonar.host.url=${env.SONARQUBE_URL} -Dsonar.login=${SONAR_TOKEN}"
                }
            }
        }

        stage('Quality Gate Validation') {
            steps {
                script {
                    // SonarQube Quality Gate check command
                    // This example assumes you have a script for checking quality gates
                    sh 'sonar-quality-gate-check'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Replace with your Docker build command
                    sh 'docker build -t myapp:latest .'
                }
            }
        }

        stage('Upload Docker Image to Nexus') {
            steps {
                script {
                    // Replace with your Docker push command
                    sh 'docker tag myapp:latest ${NEXUS_URL}/repository/myapp/myapp:latest'
                    sh 'docker push ${NEXUS_URL}/repository/myapp/myapp:latest'
                }
            }
        }

        stage('Update Kubernetes Deployment') {
            steps {
                script {
                    // Replace with your kubectl command to update the deployment
                    sh "kubectl --context=${env.KUBERNETES_CONTEXT} set image deployment/myapp myapp=${NEXUS_URL}/repository/myapp/myapp:latest"
                }
            }
        }
    }

    post {
        always {
            // Actions that should always be performed (e.g., clean up)
            cleanWs()
        }
    }
}
