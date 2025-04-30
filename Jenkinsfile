pipeline {
  agent any

  tools {
    nodejs "Node18"
  }

  environment {
    VERCEL_TOKEN = credentials('vercel-token')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'ls -la "CI-CD-Job/ci cd"' // Para verificar que package.json está ahí
      }
    }

    stage('Install Dependencies') {
      steps {
        dir('CI-CD-Job/ci cd') {
          sh 'npm install'
        }
      }
    }

    stage('Run Tests') {
      steps {
        dir('CI-CD-Job/ci cd') {
          script {
            try {
              sh 'npm test'
            } catch (e) {
              currentBuild.result = 'FAILURE'
              error("❌ Tests fallaron. Detalles: ${e}")
            }
          }
        }
      }
    }

    stage('Build') {
      when {
        expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
      }
      steps {
        dir('CI-CD-Job/ci cd') {
          sh 'npm run build'
        }
      }
    }

    stage('Validate PR (Preview Build)') {
      when {
        changeRequest()
      }
      steps {
        echo "🔍 Validando Pull Request: ${env.CHANGE_BRANCH} desde ${env.CHANGE_TARGET}"
      }
    }

    stage('Deploy Preview to Vercel') {
      when {
        allOf {
          not { branch 'main' }
          not { changeRequest() }
          expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
        }
      }
      steps {
        dir('CI-CD-Job/ci cd') {
          sh 'npm install -g vercel'
          sh 'vercel --token $VERCEL_TOKEN --confirm'
        }
      }
    }

    stage('Deploy to Vercel (main only)') {
      when {
        allOf {
          branch 'main'
          not { changeRequest() }
          expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
        }
      }
      steps {
        dir('CI-CD-Job/ci cd') {
          sh 'npm install -g vercel'
          sh 'vercel --prod --token $VERCEL_TOKEN --confirm'
        }
      }
    }
  }

  post {
    success {
      slackSend channel: '#deploys',
        message: "✅ Build exitoso en rama ${env.BRANCH_NAME}: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    }

    failure {
      mail to: 'gaelborchardt@gmail.com',
        subject: "❌ Build Fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: "La construcción falló en rama ${env.BRANCH_NAME}.\nRevisa: ${env.BUILD_URL}"

      slackSend channel: '#deploys',
        message: "❌ Build fallido en rama ${env.BRANCH_NAME}: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}"
    }
  }
}
