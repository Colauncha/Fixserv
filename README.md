# FIXSERV System - Developers guide

## Overview

Welcome to the Fixserv system, a MERN stack-based microservices
architecture which is a digital marketplace that connects users with
professional artisans specializing in gadget repairs and services.

## Author

**Evwerhamre Israel**

**Backend software engineer**

# Fixserv Architecture - Domain Driven Design

It is essential for all developers to read and understand this esign
pattern before commencing development.

- Domain driven is a software development methodology focused on
  modelling the domain and its logic in a way that aligns closely with
  business requirements

- Modelling the domain invloves defining the entities, value objects,
  aggregates, repositories and services

**- Entities:** Objects with distinct identities

**- Value objects:** Objects identified by thier attributes

**- Aggregates:** Cluster of domain objects treated as a single unit

**- Repositories:** Abstraction of data access

**- Services:** Operations that do not fit between entities or value
objects

## DDD approach to Fixserv:

- https://docs.google.com/document/d/
  19Fa5oVBdLkPmiDAs9tNKr0aktMHuG7EHtkINYqKP3K4/edit?usp=sharing

# Fixserv System - Package Management with PNPM

## Introduction to PNPM

**pnpm** (Performant NPM) is a modern package manager for JavaScript
that aims to improve upon the
shortcomings of npm and Yarn. It is designed to offer faster, more
efficient package installation
processes and disk space utilization.

## Key Differences Between PNPM and NPM

1. **Efficient Storage**
   - **pnpm**: Uses a content-addressable filesystem to store all
     package files. When multiple
     projects use the same library version, pnpm keeps a single copy of
     that library on disk. This
     approach significantly reduces disk space usage and speeds up
     installations.
   - **npm**: Installs duplicate copies of dependencies for each
     project, which can lead to
     increased disk space and slower installation times.
2. **Performance**
   - **pnpm**: Creates hard links from a single content-addressable
     storage to project
     `node_modules` directories. This method not only saves space but
     also reduces installation time.
   - **npm**: Copies files from its cache to `node_modules` directories
     consuming more resources
     and time.

## Setting Up PNPM for a Mono-Repo

pnpm supports mono-repository setups using its built-in support for
workspace configurations. This
allows multiple packages in a single repository to share a common set o
dependencies.

### Installation

First, install pnpm globally if it is not already installed:

```bash
npm install -g pnpm
```

## Configuring Mono-Repo

Create a `pnpm-workspace.yaml` file in the root of your repository:

```yaml
packages:
  - "services/*"
```

This configuration tells pnpm that each subdirectory inside `services/`
is a separate package or
service.

## License

This project is licensed under the MIT License.
