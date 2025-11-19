# andasy.hcl app configuration file generated for telemedecine-rw on Wednesday, 19-Nov-25 21:17:28 CAT
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "telemedecine-rw"

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
    name = "telemedecine-rw"
  }

}
