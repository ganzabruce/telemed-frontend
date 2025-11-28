# andasy.hcl app configuration file generated for telemed-fn on Thursday, 27-Nov-25 15:32:09 CAT
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "telemed-fn"

app {

  env = {}

  port = 80

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "telemed-fn"
  }

}
