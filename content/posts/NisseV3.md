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
image: /images/post/post-1.png
imageInfo:
    original:           https://unsplash.com/photos/g29arbbvPjo
    License:            Unsplash License
    LicenseLink:        https://unsplash.com/license
    Attribution:        Possessed Photography
    AttributionLink:    https://unsplash.com/@possessedphotography
featured: true
draft: false
disqusId: "http://lokiastari.com/blog/2024/11/10/Nisse/"
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

If you are a large company trusted by the Internet, you can create your own root certificate. While this is not difficult, it is of little value if no one trusts you. Therefore, the crucial step for a root certificate holder is becoming trusted by tools that validate certificates. Losing trust would mean having your root certificate removed from the list people use to validate certificates (i.e., the Chrome browser team would remove your certificate from the list of root certificates it trusts). This loss of trust would affect the root certificate authority and all downstream companies that hold certificates based on that root certificate; a browser would mark any sites using an untrusted root certificate as not being trusted.

Obtaining a certificate from a trusted root authority can be expensive and is typically only done by companies that issue certificates. However, you don't necessarily need a certificate from a root authority; you can get a certificate from a vendor that has a certificate issued by a root authority. Every trusted certificate authority has a process to validate that you own a domain, which allows them to create and deliver a signed certificate to you, but each authority's process is different. But for normal people (and small companies), you can get relatively cheap SSL certificates from most domain providers (like `GoDaddy`) that will create and manage your SSL Certificate for your domain.

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

### What is the next step

We have a Web Server that can connect over SSL. But the server only handles request serially. So the next article looks at how to add some basic parallelism to support multiple simultaneous connections.


