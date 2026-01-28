FROM hashicorp/vault:1.15.0

COPY vault-init/init-secrets.sh /vault-init/init-secrets.sh
RUN chmod +x /vault-init/init-secrets.sh

ENTRYPOINT ["/vault-init/init-secrets.sh"]

