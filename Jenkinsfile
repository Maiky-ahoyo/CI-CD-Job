pipeline {
  agent any

  tools {
    nodejs "nodeJS"
  }

  environment {
    VERCEL_TOKEN = credentials('vercel-token')
    GITHUB_TOKEN = credentials('97c23b1d-31b0-4fd1-8cfe-d6e7e9b98b7c')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'ls -la "ci-cd"'
      }
    }

    stage('Install Dependencies') {
      steps {
        dir("ci-cd") {
          sh 'npm install --legacy-peer-deps'
        }
      }
    }

    stage('Run Tests') {
      steps {
        dir("ci-cd") {
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
        dir("ci-cd") {
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
        dir("ci-cd") {
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
        dir("ci-cd") {
          sh 'npm install -g vercel'
          sh 'vercel --prod --token $VERCEL_TOKEN --confirm'
        }
      }
    }

    stage('Merge Pull Request') {
      when {
        changeRequest()
      }
      steps {
        script {
          sh 'which gh || (curl -fsSL https://cli.github.com/install.sh | sh || true)'
          sh 'echo "$GITHUB_TOKEN" | gh auth login --with-token'

          def mergeStatus = sh(
            script: "gh pr merge $CHANGE_ID --merge --delete-branch --repo $CHANGE_URL",
            returnStatus: true
          )

          if (mergeStatus != 0) {
            currentBuild.result = 'UNSTABLE'
            error("⚠️ No se pudo hacer merge automático del PR #${CHANGE_ID}. Revisa conflictos.")
          } else {
            echo "✅ Pull Request #${CHANGE_ID} mergeado correctamente."
          }
        }
      }
    }
  }

  post {
    success {
      mail to: 'gaelborchardt@gmail.com, migelatinapkin@gmail.com, frannperez874@gmail.com',
        subject: "✅ Build exitoso: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: "La construcción fue exitosa en la rama ${env.BRANCH_NAME}.\nRevisa: ${env.BUILD_URL}"

      slackSend channel: '#api1',
        message: "✅ Build exitoso en rama ${env.BRANCH_NAME}: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    }

    unstable {
      mail to: 'gaelborchardt@gmail.com, migelatinapkin@gmail.com, frannperez874@gmail.com',
        subject: "⚠️ Error al mergear PR: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: "No se pudo hacer merge automático del Pull Request en la rama ${env.BRANCH_NAME}. Revisa conflictos.\n\nDetalles: ${env.BUILD_URL}"

      slackSend channel: '#api1',
        message: "⚠️ Falló merge automático del PR #${env.CHANGE_ID} en rama ${env.BRANCH_NAME}.\n${env.BUILD_URL}"
    }

    failure {
      mail to: 'gaelborchardt@gmail.com, migelatinapkin@gmail.com, frannperez874@gmail.com',
        subject: "❌ Build Fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        body: "La construcción falló en la rama ${env.BRANCH_NAME}.\nRevisa: ${env.BUILD_URL}"

      slackSend channel: '#api1',
        message: "❌ Build fallido en rama ${env.BRANCH_NAME}: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}"
    }
  }
}
