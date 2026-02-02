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
          "name": "verificationRecord",
          "writable": true
        },
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
          "name": "verificationRecord",
          "writable": true
        },
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
          "name": "verificationRecord",
          "writable": true
        },
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
