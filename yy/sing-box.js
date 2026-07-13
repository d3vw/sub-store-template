const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

let compatible
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// sing-box requires wireguard/tailscale to live in top-level `endpoints`, not `outbounds`
const endpoint_types = ['wireguard', 'tailscale']
const endpoints = proxies.filter(p => endpoint_types.includes(p.type))
const outbounds = proxies.filter(p => !endpoint_types.includes(p.type))

config.outbounds.push(...outbounds)
if (endpoints.length > 0) {
  config.endpoints = [...(config.endpoints ?? []), ...endpoints]
}

const auto_exclude_keywords = /解锁|失联|订阅|频道|网址|流量|重置|到期|过期|套餐/i

config.outbounds.map(i => {
  // Populate feature selectors with proxies
  if (['proxy', 'google', 'claude', 'polymarket', 'youtube', 'ai', '🚀 节点选择', '🅖  Google', '🔮 AI'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /feat/i))
  }
  if (['all', 'all-auto', 'GLOBAL'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies))
  }
  if (i.tag === '♻️ 自动选择') {
    i.outbounds.push(...getTags(proxies).filter(tag => !auto_exclude_keywords.test(tag)))
  }
  if (['hk', 'hk-auto', '🇭🇰 香港节点'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /港|hk|hongkong|kong kong|🇭🇰/i))
  }
  if (['tw', 'tw-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /台|tw|taiwan|🇹🇼/i))
  }
  if (['jp', 'jp-auto', '🇯🇵 日本节点'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /日本|jp|japan|🇯🇵/i))
  }
  if (['sg', 'sg-auto', '🇸🇬 狮城节点'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?!.*(?:us)).*(新|sg|singapore|🇸🇬)/i))
  }
  if (['us', 'us-auto', '🇺🇲 美国节点'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /美|us|unitedstates|united states|🇺🇸/i))
  }
})

config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
