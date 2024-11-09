Nisse V3
---
layout: post
title: "SSL Certificates"
date: 2024-11-10T12:48:30-0800
author: Loki Astari, (C)2024
comments: true
categories: ["C++", "Nisse", "Server", "C++-By-Example", "Coding"]
series: Nisse
tags: Nisse
sharing: true
footer: true
subtitle: Nisse
description: Nisse. The step by step creation of a C++ Server architecture.
image: /images/post/post-4.png
imageInfo:
    original:           https://unsplash.com/photos/W-oqNwbmin0
    License:            Unsplash License
    LicenseLink:        https://unsplash.com/license
    Attribution:        Oscar Nilsson
    AttributionLink:    https://unsplash.com/@oscrse
featured: true
draft: false
disqusId: "http://lokiastari.com/blog/2024/11/08/Nisse/"
---

# [Nisse](https://github.com/Loki-Astari/Nisse)

In the previous article, "C++ Sockets," I discussed the addition of support for SSL certificates. But what is an SSL certificate, and how do you obtain one?


## SSL Certificates

The SSL certificate has two main purposes.

1. Securely encrypt all traffic between the client and server.
2. Provides trust that you are talking to a server on the requested domain.

### The Basics

SSL certificates are issued by trusted certificate authorities and contain information that validates the certificate cryptographically. When a browser connects to a website, the server returns the certificate, which includes crucial information such as the issuing company. Before establishing a secure connection, the browser validates the certificate against the issuing company’s SSL certificate to ensure it is not forged. If the issuing company is a subsidiary, it recursively looks up the parent company that issued the certificate and validates their certificates until it reaches a root certificate. This process creates a chain of trust leading to a known trusted root certificate.

All modern browsers know how to find and validate root certificates. They also have information about compromised certificate authorities whose certificates should no longer be trusted. Therefore, it is important to download only trusted browsers and keep them up to date.

Once a certificate has been validated, the browser knows it is communicating with a server for a specific domain (as the domain information is included in the certificate). Modern browsers indicate a secure connection, usually with a green padlock next to the URL. The browser can then use the public key in the certificate to establish a secure connection with the domain you are connecting to.

### Where can you get a certificate

If you are a large company that is trusted by the internet, you can create your own root certificate. While creating your own root certificate is not difficult, it holds little value if no one trusts you.

Getting a certificate from a trusted root authority is expensive and is only usually done by other companies that issue certificates. But for normal people, you can get relatively cheap SSL certificates from most domain providers `GoDaddy` that will create and manage your SSL Certificate for your domain.

### Free Certificates

You can get Free SSL Certificates from a company called [Let’s Encrypt](https://letsencrypt.org/). 

## How to Use ThorsSocket With an SSL Certificate

In ThorsSocket a normal socket is created with the following code:

```C++
    ThorsAnvil::ThorsSocket::Server   server(ServerInit{port});

    ThorsAnvil::ThorsSocket::Socket   socket = server.accept();          // A normal bi-direconal socket.
```

To create a secure connection, specify the location of the SSL certificate file on the host file system. If you use [Let’s Encrypt](https://letsencrypt.org/), the default location for the SSL certificate is `/etc/letsencrypt/live/<domainName>/fullchain.pem`, and the private key is located at `/etc/letsencrypt/live/<domainName>/privkey.pem`. You can then create a secure SSL connection with:

```C++
    // The path where the certificates for “thorsanvil.dev” are stored. 
    std::string   certPath = "/etc/letsencrypt/live/thorsanvil.dev”;

    // Create a certificate object that contains the SSL Certificate and private key.
    // Note: Some files require you to provide a password to access the certificate, please see the documentation
    // on how to add appropriate lambda’s to retrieve the password from secure storage (as they should not be in the code)
    ThorsAnvil::ThorsSocket::CertificateInfo     certificate{std::filesystem::canonical(std::filesystem::path(certPath) /= "fullchain.pem”,
                                                             std::filesystem::canonical(std::filesystem::path(certPath) /= "privkey.pem”
                                                            };
    ThorsAnvil::ThorsSocket::SSLctx              ctx{ThorsAnvil::ThorsSocket::SSLMethodType::Server, certificate};
    ThorsAnvil::ThorsSocket::Server              server(SServerInit{port, std::move(ctx)});

    ThorsAnvil::ThorsSocket::Socket   socket = server.accept();          // A secure bi-direconal SSL socket.
```

