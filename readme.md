# Clés privées et publiques

## Générer les clés

```bash
openssl genrsa -out jwtprivate.pem 2048
openssl rsa -in jwtprivate.pem -pubout -outform PEM -out jwtpublic.pem
```

## Auth-service

Ajouter les clés privées et publiques dans le dossier auth-service

auth-service/keys/

## Gateway-service

Ajouter la clé publique dans le dossier gateway-service

gateway-service/keys/
