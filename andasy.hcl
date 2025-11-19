# andasy.hcl app configuration file generated for telemed-frontend on Wednesday, 19-Nov-25 21:05:34 CAT
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "telemed-frontend"

app {

  image = "registry.andasy.io/telemed-frontend:latest-1763564235218"

  env = {}

  port = 80

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "telemed-frontend"
  }

}
