
title: nbhd.city
app goals and description: 
    - an online static site generator - generates homepages w/ blogs for each of its members (nbrs) 
    - nbrs pages have blogs which are published as posts to the at:\\ protocol 
    - the nbhd page is an aggregator of its nbrs' posts and any others the group decides to add from the bsky pipeline 

    
lets change how the homepage folder works. currently it is a just a REACT based website. 

We are going to instead implement using HUGO, the static site generator to generate the files for 'homepages' like this for each user via the API. update the api to use the HUGO project. 

add options to user creation for homepage generation to use separate domain but to add and use a subdomain of the nbhd domain by default

tickets

    - [ ] nbhds
        - [ ] nbhd landing page w/login
        - [ ] Create new account vs use bsky 
            - [ ] uses subdomain off of nbhd url or custom domain
        - [ ] button / page to create homepages for a project, not account 
        - [ ] Bsky list integration
        - [ ] Tools plugins system
        - [ ] Chat and collaboration tools as plugins
        - [ ] An agent that creates plugins

    - [ ] Homepages
        - [ ] no login - static site - managed via nbhd site generator
        - [ ] Blogs w/ os js md editor
        - [ ] Publish summaries of blog as a skeet 
        - [ ] List of nbhds 
        - [ ] DNS for bsky authentication
        - [ ] admin page to configure separate domain, update content


    - [ ] AT protocol
        - [ ] Personal Data Store, PDS
        - the nbhd has a db that functions as a pds for its users
        - sqlite? 

    - [ ] API
        - [ ] endpoints w / functions to create new account
        - [ ] static site generator for homepages - mvp of just two themes to choose from
        - [ ] an AI agent theme generator from Logo, colors, style    
        
            - [ ] set up for pds,

- a collaboration tools plugin system; mvp plugins will include:
        - posts and comments
        - a collaborative text editor
        - simple project managment
            - use homepage creator to generate project homepage
            - tasks' content are reflected in project page's text so as they move through kanban or are updated - so is homepage
            - a calendar to track tasks
            - wiki 