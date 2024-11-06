#!/bin/bash

exec ssh -i ~/.ssh/github-deploy-key-clients-auto -o IdentitiesOnly=yes -o StrictHostKeyChecking=no "$@"
chmod +x /tmp/ssh_wrapper.sh
