[![Tigma](https://binalyze.github.io/tigma/public/header-image.png "Sigma + TypeScript = Tigma")](#)

[![Build Status](https://binalyze.visualstudio.com/Binalyze.Tigma/_apis/build/status/Binalyze.Tigma?branchName=master)](https://binalyze.visualstudio.com/Binalyze.Tigma/_build/latest?definitionId=11&branchName=master)

# Tigma
Tigma is a fully compliant library for loading, parsing, and validating Sigma rules in a JS environment (browser or node). This enables Sigma to reach even further by opening up new platforms supporting Javascript (almost anything out there). 

The library is compliant with original Sigma Language specification and doesn't have anything custom (at least for now).

## How does it work?
At its core, it converts Sigma Rule to an Abstract Syntax Tree (AST) of Identifier objects which makes it easier to implement backends. 

The only available backend, for now, is the "Sigma JSON Scanner" which is the main reason for developing this library.

### Evaluation
Tigma uses lazy evaluation behind the scenes meaning that writing a condition such as "1 of them" will return true when the first condition is matched without requiring the evaluation of the remaining conditions.  

## Tigma: Empowering DFIR with Sigma
As you already know, Sigma is a SIEM oriented language which is easy to read/write and share which made it receive a high adoption rate in a short period of time. This is great but wouldn't it better to scan a full JSON file such as the forensic state of the endpoint captured at a specific time? We asked this question some time ago and the answer was obviously YES!

If you are curious about what does "scanning the forensic state of an endpoint" mean check the example below:

Example Rule:
```yaml
title: Some Rule
description: Just a sample for demonstration
...
detection:
  selection:
    Process:
      Name: 
        - FancyRAT.exe
        - Lolbin.exe
      DigitalSignature:
        Publisher: Ultimate APT Company
    Autoruns:
      RootKey: HKLM
      KeyPath: Software\Wow6432Node\APT\Auto
    Prefetch:
      Name|endswith: 'katz.exe'
    TCPTable:
      TargetIP: 
        - 171.13.209.82
        - 171.13.209.83
  condition: selection
```

Now you know why it is cool :) Think about sharing these type of "contextful signatures" for scanning against an endpoint locally or its captured state such as the one created by [Binalyze IREC](http://binalyze.com/products/irec) / [AIR](http://binalyze.com/products/air).

## How to start?
```
git clone https://github.com/binalyze/tigma.git
cd tigma
npm install
npm run start:dev
```

## Live Demo / Playground
[![Playground](https://binalyze.github.io/tigma/public/playground-header.png "Tigma Playground")](https://binalyze.github.io/tigma/public/playground.htm)

See it in action by visiting <a href="https://binalyze.github.io/tigma/public/playground.htm" target="_blank">Tigma Playground</a>

## Work in progress
 - [x] Implement support for YAML multiple documents
 - [x] Increase support for modifiers
 - [x] Improve playground page
 - [ ] Implement support for aggregation
 
 
 ## Credits
 Special Thanks go to the creators of Sigma and all contributors starting with:
 - [Thomas Patzke](https://github.com/thomaspatzke)
 - [Florian Roth](https://github.com/Neo23x0)
