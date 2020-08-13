const fs = require('fs')
const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

const COUNT = 10

async function generateTestWallet (addressesCount) {
  const outObj = {
    addresses: {}
  }
  const mnemonic = await bchjs.Mnemonic.generate(128)
  outObj.mnemonic = mnemonic
  const seedBuffer = await bchjs.Mnemonic.toSeed(mnemonic)
  const masterHDNode = await bchjs.HDNode.fromSeed(seedBuffer)
  for (let i = 0; i < addressesCount; i++) {
    const childNode = masterHDNode.derivePath(`m/44'/145'/0'/0/${i}`)
    const cashAddress = bchjs.HDNode.toCashAddress(childNode)
    outObj.addresses[i] = {
      cashAddress: cashAddress,
      legacyAddress: bchjs.HDNode.toLegacyAddress(childNode),
      WIF: bchjs.HDNode.toWIF(childNode)
    }
    // use first address as a moderator's one
    if (i === 0) {
      fs.writeFile('.env.test', `export STAKK_MODERATOR=${cashAddress}`, function (err) {
        if (err) return console.error(err)
        console.log('.env.test written successfully.')
      })
    }
  }

  fs.writeFile('./wallet.json', JSON.stringify(outObj, null, 2), function (err) {
    if (err) return console.error(err)
    console.log('wallet.json written successfully.')
  })
}
generateTestWallet(COUNT)
