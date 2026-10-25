// Generated automatically. Do not edit.

export const collections = {
  "blocks": {
    "kind": "folder",
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "folder": "content/blocks",
    "extension": "yml",
    "format": "yaml",
    "relations": {
      "category": {
        "collection": "categories",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "tags": {
        "collection": "tags",
        "multiple": true,
        "valueField": "{{slug}}"
      }
    }
  },
  "categories": {
    "kind": "folder",
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "folder": "content/categories",
    "extension": "yml",
    "format": "yaml",
    "relations": {
      "parent": {
        "collection": "categories",
        "multiple": false,
        "valueField": "{{slug}}"
      }
    }
  },
  "colour-schemes": {
    "kind": "folder",
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "folder": "content/colour-schemes",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "navigation": {
    "kind": "folder",
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "folder": "content/navigation",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "pages": {
    "kind": "folder",
    "publicRoute": true,
    "rss": false,
    "template": "page",
    "listTemplate": "default",
    "folder": "content/pages",
    "extension": "md",
    "format": "markdown",
    "relations": {
      "blocks": {
        "collection": "blocks",
        "multiple": true,
        "valueField": "{{slug}}"
      }
    }
  },
  "people": {
    "kind": "folder",
    "publicRoute": true,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "folder": "content/people",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "podcasts": {
    "kind": "folder",
    "publicRoute": true,
    "rss": "podcast",
    "template": "podcast",
    "listTemplate": "episodes",
    "folder": "content/podcasts",
    "extension": "md",
    "format": "markdown",
    "relations": {
      "author": {
        "collection": "people",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "narrator": {
        "collection": "people",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "presenter": {
        "collection": "people",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "producer": {
        "collection": "people",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "category": {
        "collection": "categories",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "tags": {
        "collection": "tags",
        "multiple": true,
        "valueField": "{{slug}}"
      }
    }
  },
  "posts": {
    "kind": "folder",
    "publicRoute": true,
    "rss": "standard",
    "template": "post",
    "listTemplate": "default",
    "folder": "content/posts",
    "extension": "md",
    "format": "markdown",
    "relations": {
      "author": {
        "collection": "people",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "category": {
        "collection": "categories",
        "multiple": false,
        "valueField": "{{slug}}"
      },
      "tags": {
        "collection": "tags",
        "multiple": true,
        "valueField": "{{slug}}"
      }
    }
  },
  "settings": {
    "kind": "files",
    "files": [
      {
        "name": "general",
        "file": "content/settings/general.yml",
        "format": "yaml",
        "relations": {
          "homePage": {
            "collection": "pages",
            "multiple": false,
            "valueField": "{{slug}}"
          },
          "activeScheme": {
            "collection": "colour-schemes",
            "multiple": false,
            "valueField": "{{slug}}"
          },
          "activeTypography": {
            "collection": "typography",
            "multiple": false,
            "valueField": "{{slug}}"
          }
        }
      }
    ]
  },
  "tags": {
    "kind": "folder",
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "folder": "content/tags",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "typography": {
    "kind": "folder",
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "folder": "content/typography",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  }
} as const;

export type CollectionName = keyof typeof collections;
