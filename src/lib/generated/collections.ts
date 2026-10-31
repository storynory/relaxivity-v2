// Generated automatically. Do not edit.

export const collections = {
  "audio": {
    "kind": "folder",
    "label": "Audio",
    "labelSingular": "Episode",
    "archive": {
      "title": "Audio Stories",
      "introduction": "",
      "seo": {
        "title": "Audio Stories",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": true,
    "rss": "podcast",
    "template": "podcast",
    "listTemplate": "episodes",
    "templateOverrides": [],
    "folder": "content/audio",
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
  "blocks": {
    "kind": "folder",
    "label": "Blocks",
    "labelSingular": "Block",
    "archive": {
      "title": "Blocks",
      "introduction": "",
      "seo": {
        "title": "Blocks",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "templateOverrides": [],
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
    "label": "Categories",
    "labelSingular": "Category",
    "archive": {
      "title": "Categories",
      "introduction": "",
      "seo": {
        "title": "Categories",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "templateOverrides": [],
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
    "label": "Colour Schemes",
    "labelSingular": "Colour Scheme",
    "archive": {
      "title": "Colour Schemes",
      "introduction": "",
      "seo": {
        "title": "Colour Schemes",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "templateOverrides": [],
    "folder": "content/colour-schemes",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "navigation": {
    "kind": "folder",
    "label": "Navigation",
    "labelSingular": "Menu",
    "archive": {
      "title": "Navigation",
      "introduction": "",
      "seo": {
        "title": "Navigation",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "templateOverrides": [],
    "folder": "content/navigation",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "pages": {
    "kind": "folder",
    "label": "Pages",
    "labelSingular": "Pages",
    "archive": {
      "title": "pages",
      "introduction": "",
      "seo": {
        "title": "pages",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": true,
    "rss": false,
    "template": "page",
    "listTemplate": "default",
    "templateOverrides": [
      "landing",
      "page"
    ],
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
    "label": "People",
    "labelSingular": "Person",
    "archive": {
      "title": "People",
      "introduction": "",
      "seo": {
        "title": "people",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": true,
    "rss": false,
    "template": "person",
    "listTemplate": "people",
    "templateOverrides": [],
    "folder": "content/people",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "posts": {
    "kind": "folder",
    "label": "Posts",
    "labelSingular": "Post",
    "archive": {
      "title": "posts",
      "introduction": "",
      "seo": {
        "title": "posts",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": true,
    "rss": "standard",
    "template": "post",
    "listTemplate": "default",
    "templateOverrides": [],
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
    "label": "Tags",
    "labelSingular": "Tag",
    "archive": {
      "title": "Tags",
      "introduction": "",
      "seo": {
        "title": "Tags",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "templateOverrides": [],
    "folder": "content/tags",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  },
  "typography": {
    "kind": "folder",
    "label": "Typography Presets",
    "labelSingular": "Typography Preset",
    "archive": {
      "title": "Typography Presets",
      "introduction": "",
      "seo": {
        "title": "Typography Presets",
        "description": "",
        "image": ""
      }
    },
    "publicRoute": false,
    "rss": false,
    "template": "default",
    "listTemplate": "default",
    "templateOverrides": [],
    "folder": "content/typography",
    "extension": "yml",
    "format": "yaml",
    "relations": {}
  }
} as const;

export type CollectionName = keyof typeof collections;

export const templateNames = ["default","landing","page","person","podcast","post"] as const;
