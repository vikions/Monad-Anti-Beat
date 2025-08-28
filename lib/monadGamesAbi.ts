
export const monadGamesAbi = [
  {
    "type":"function","stateMutability":"nonpayable","name":"registerGame",
    "inputs":[
      {"name":"_game","type":"address"},
      {"name":"_name","type":"string"},
      {"name":"_image","type":"string"},
      {"name":"_url","type":"string"}
    ],
    "outputs":[]
  },
  {
    "type":"function","stateMutability":"nonpayable","name":"updatePlayerData",
    "inputs":[
      {"name":"player","type":"address"},
      {"name":"scoreAmount","type":"uint256"},
      {"name":"transactionAmount","type":"uint256"}
    ],
    "outputs":[]
  }
] as const;
