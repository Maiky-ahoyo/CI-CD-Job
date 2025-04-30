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

    stage('Create or Merge PR') {
      when {
        not { branch 'main' }
      }
      steps {
        script {
          sh 'sudo apt update && sudo apt install -y curl && curl -fsSL https://github.com/cli/cli/releases/download/v2.49.0/gh_2.49.0_linux_amd64.deb -o gh.deb && sudo dpkg -i gh.deb'
          sh 'echo "$GITHUB_TOKEN" | gh auth login --with-token'

          def repo = sh(script: 'git config --get remote.origin.url | sed -E "s/.*github.com[/:](.*)\\.git/\\1/"', returnStdout: true).trim()
          def branch = env.BRANCH_NAME

          def prCheck = sh(
            script: "gh pr list --repo ${repo} --head ${branch} --json number --jq '.[0].number'",
            returnStdout: true
          ).trim()

          if (prCheck == '') {
            echo "No se encontró PR desde ${branch}, creando uno..."
            sh "gh pr create --repo ${repo} --head ${branch} --base main --title 'Merge ${branch} into main' --body 'Creado automáticamente por Jenkins'"
            prCheck = sh(
              script: "gh pr list --repo ${repo} --head ${branch} --json number --jq '.[0].number'",
              returnStdout: true
            ).trim()
          } else {
            echo "PR existente encontrado: #${prCheck}"
          }

          def mergeStatus = sh(
            script: "gh pr merge ${prCheck} --merge --delete-branch --repo ${repo}",
            returnStatus: true
          )

          if (mergeStatus != 0) {
            currentBuild.result = 'UNSTABLE'
            error("⚠️ No se pudo hacer merge automático del PR #${prCheck}. Revisa conflictos.")
          } else {
            echo "✅ Pull Request #${prCheck} mergeado correctamente."
          }
        }
      }
    }

    stage('Deploy to Vercel (main only)') {
      when {
        allOf {
          branch 'main'
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

    stage('Tag and Release (main only)') {
      when {
        allOf {
          branch 'main'
          expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
        }
      }
      steps {
        script {
          sh 'sudo apt update && sudo apt install -y curl && curl -fsSL https://github.com/cli/cli/releases/download/v2.49.0/gh_2.49.0_linux_amd64.deb -o gh.deb && sudo dpkg -i gh.deb'
          sh 'echo "$GITHUB_TOKEN" | gh auth login --with-token'

          def repo = sh(script: 'git config --get remote.origin.url | sed -E "s/.*github.com[/:](.*)\\.git/\\1/"', returnStdout: true).trim()
          def lastTag = sh(script: "git fetch --tags && git tag --sort=-v:refname | grep '^v' | head -n 1", returnStdout: true).trim()
          def newTag = ""

          if (lastTag == "") {
            newTag = "v1.0.0"
          } else {
            def (major, minor, patch) = lastTag.replace("v", "").tokenize(".").collect { it.toInteger() }
            newTag = "v${major}.${minor}.${patch + 1}"
          }

          sh "git config user.name 'Jenkins'"
          sh "git config user.email 'jenkins@localhost'"
          sh "git tag -a ${newTag} -m 'Release ${newTag}'"
          sh "git push origin ${newTag}"

          sh "gh release create ${newTag} --repo ${repo} --title 'Release ${newTag}' --notes 'Release creado automáticamente por Jenkins para el build #${env.BUILD_NUMBER}'"
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
           body: "No se pudo hacer merge automático del Pull Request para la rama ${env.BRANCH_NAME}. Revisa conflictos.\n\nDetalles: ${env.BUILD_URL}"

      slackSend channel: '#api1',
                message: "⚠️ Falló merge automático del PR para rama ${env.BRANCH_NAME}.\n${env.BUILD_URL}"
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
