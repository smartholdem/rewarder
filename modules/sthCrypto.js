const crypto = require("crypto");
const sth = require("sthjs");

class sthCrypto {
    async signMessage(message, passphrase) {
        let hash = crypto.createHash('sha256')
        hash = hash.update(Buffer.from(message, 'utf-8')).digest()
        const ecpair = sth.crypto.getKeys(passphrase)
        return ({signature: ecpair.sign(hash).toDER().toString('hex')}) // obj.signature
    }

    async verifyMessage(message, publicKey, signature) {
        // check for hexadecimal, otherwise the signature check would may fail
        const re = /[0-9A-Fa-f]{6}/g
        if (!re.test(publicKey) || !re.test(signature)) {
            // return here already because the process will fail otherwise
            return false
        }
        let hash = crypto.createHash('sha256')
        hash = hash.update(Buffer.from(message, 'utf-8')).digest()
        const ecpair = sth.ECPair.fromPublicKeyBuffer(Buffer.from(publicKey, 'hex'))
        const ecsignature = sth.ECSignature.fromDER(Buffer.from(signature, 'hex'))
        return (ecpair.verify(hash, ecsignature))
    }

}

module.exports = sthCrypto;
