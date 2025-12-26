group "default" {
  targets = ["app"]
}

target "core" {
  context = "./core"
  dockerfile = "Dockerfile"
  target = "frankenphp_prod"
  tags = ["auth-core"]
}

target "webfront" {
  context = "./webfront"
  dockerfile = "Dockerfile"
  target = "angular-prod"
  tags = ["auth-webfront"]
}

target "app" {
  context = "."
  dockerfile = "Dockerfile"
  tags = ["auth"]
  contexts = {
    core = "target:core"
    webfront = "target:webfront"
  }
}
