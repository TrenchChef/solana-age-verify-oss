/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/age_registry.json`.
 */
export type AgeRegistry = {
  "address": "AgeVwjVjNpRYkk1TzkLPG7S1bvMoa4J3bwuVbs161k3q",
  "metadata": {
    "name": "ageRegistry",
    "version": "0.2.1",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeVerification",
      "discriminator": [
        61,
        217,
        221,
        113,
        140,
        80,
        8,
        93
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "createVerification",
      "discriminator": [
        138,
        217,
        90,
        236,
        221,
        116,
        243,
        59
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocolTreasury",
          "writable": true
        },
        {
          "name": "appTreasury",
          "writable": true
        },
        {
          "name": "gatekeeper",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "defined": {
              "name": "validityProof"
            }
          }
        },
        {
          "name": "addressTreeInfo",
          "type": {
            "defined": {
              "name": "packedAddressTreeInfo"
            }
          }
        },
        {
          "name": "outputTreeIndex",
          "type": "u8"
        },
        {
          "name": "facehash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "verifiedAt",
          "type": "i64"
        },
        {
          "name": "over18",
          "type": "bool"
        },
        {
          "name": "appFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateVerification",
      "discriminator": [
        81,
        184,
        217,
        235,
        163,
        170,
        228,
        38
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "protocolTreasury",
          "writable": true
        },
        {
          "name": "appTreasury",
          "writable": true
        },
        {
          "name": "gatekeeper",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proof",
          "type": {
            "defined": {
              "name": "validityProof"
            }
          }
        },
        {
          "name": "accountMeta",
          "type": {
            "defined": {
              "name": "compressedAccountMeta"
            }
          }
        },
        {
          "name": "currentRecord",
          "type": {
            "defined": {
              "name": "verificationRecord"
            }
          }
        },
        {
          "name": "facehash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "verifiedAt",
          "type": "i64"
        },
        {
          "name": "over18",
          "type": "bool"
        },
        {
          "name": "appFee",
          "type": "u64"
        }
      ]
    }
  ],
  "events": [
    {
      "name": "verificationEvent",
      "discriminator": [
        38,
        156,
        13,
        173,
        174,
        118,
        95,
        168
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "verificationStillValid",
      "msg": "Verification is still valid."
    }
  ],
  "types": [
    {
      "name": "compressedAccountMeta",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "treeInfo",
            "docs": [
              "Merkle tree context."
            ],
            "type": {
              "defined": {
                "name": "packedStateTreeInfo"
              }
            }
          },
          {
            "name": "address",
            "docs": [
              "Address."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "outputStateTreeIndex",
            "docs": [
              "Output merkle tree index."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "compressedProof",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "a",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "b",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "c",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "packedAddressTreeInfo",
      "docs": [
        "Packed address tree info for instruction data.",
        "Contains indices to address tree accounts and root index."
      ],
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "addressMerkleTreePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "addressQueuePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "rootIndex",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "packedStateTreeInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rootIndex",
            "type": "u16"
          },
          {
            "name": "proveByIndex",
            "type": "bool"
          },
          {
            "name": "merkleTreePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "queuePubkeyIndex",
            "type": "u8"
          },
          {
            "name": "leafIndex",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "validityProof",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "option": {
              "defined": {
                "name": "compressedProof"
              }
            }
          }
        ]
      }
    },
    {
      "name": "verificationEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "userCode",
            "type": "string"
          },
          {
            "name": "verifiedAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "over18",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "verificationRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "facehash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "userCode",
            "type": "string"
          },
          {
            "name": "over18",
            "type": "bool"
          },
          {
            "name": "verifiedAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
