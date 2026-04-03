import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, Cpu } from 'lucide-react'

const translations = {
  en: {
    title: 'Segment Routing Reference',
    subtitle: 'Comprehensive reference for Segment Routing: SR-MPLS, SRv6, Flex-Algo and TI-LFA FRR.',
    sections: 'Topics',
    references: 'References',
    refList: [
      'RFC 8402 - Segment Routing Architecture',
      'RFC 8986 - SRv6 Network Programming',
      'RFC 8665 - OSPF Extensions for SR',
      'RFC 8667 - IS-IS Extensions for SR',
    ],
    builtBy: 'Built by',
    topics: {
      srmpls: {
        label: 'SR-MPLS Segments',
        sections: [
          {
            title: 'Node SID',
            desc: 'A globally unique MPLS label identifying a specific router (node) in the SR domain. Assigned from the Segment Routing Global Block (SRGB). Any packet with this label will be forwarded to that node along the shortest IGP path.',
            details: ['Globally significant across the SR domain', 'Distributed via IGP (OSPF/IS-IS TLV extensions)', 'Used for TE path construction and traffic steering'],
            code: ['! Cisco IOS-XR\nsegment-routing\n mpls\n  connected-prefix-sid-map\n   address-family ipv4\n    10.0.0.1/32 index 100 range 1'],
          },
          {
            title: 'Adjacency SID',
            desc: 'A locally significant MPLS label representing a specific interface/adjacency between two routers. Forwarding is to the specific next-hop regardless of shortest path. Used to steer traffic over specific links.',
            details: ['Locally significant (only on the originating node)', 'Dynamically allocated by the router (from local label block)', 'Can be manually configured as well'],
            code: ['! IS-IS adjacency SID example\nrouter isis 1\n interface GigabitEthernet0/0/0\n  segment-routing adjacency-sid index 200'],
          },
          {
            title: 'Prefix SID',
            desc: 'Similar to Node SID but can represent any IP prefix (not just a loopback). The SID for a prefix is globally unique and distributed via the IGP.',
            details: ['Can represent any prefix (not just /32 loopbacks)', 'Can be absolute label or index (offset from SRGB base)', 'Allows per-prefix traffic engineering'],
            code: [],
          },
          {
            title: 'Binding SID (BSID)',
            desc: 'A local label that maps to a pre-computed SR path (segment list). When a packet arrives with the BSID, the router replaces it with the full segment stack. Used in SR-TE policies and inter-domain stitching.',
            details: ['Maps to a segment list (SR policy)', 'Enables end-to-end path stitching across domains', 'Used in SR-PCE (Path Computation Element) deployments'],
            code: [],
          },
        ],
      },
      srv6: {
        label: 'SRv6 Behaviors',
        sections: [
          {
            title: 'End (Node endpoint)',
            desc: 'The basic SRv6 endpoint behavior. A node receiving a packet with this SID as the destination advances the pointer to the next segment in the SRH (Segment Routing Header).',
            details: ['Processes the Segment Routing Header (SRH)', 'Decrements Segments Left counter', 'Updates IPv6 destination address to next SID'],
            code: ['# Linux kernel SRv6\nip -6 route add fc00:1::/64 encap seg6local action End dev lo'],
          },
          {
            title: 'End.X (L3 cross-connect)',
            desc: 'Routes the packet out a specific interface/next-hop when the SID is matched. Analogous to adjacency SID in SR-MPLS. Used for traffic engineering over specific links.',
            details: ['Forwards packet to a specific next-hop interface', 'Processes SRH before forwarding'],
            code: ['# Linux kernel End.X\nip -6 route add fc00:1::/64 encap seg6local action End.X nh6 fc00::2 dev eth0'],
          },
          {
            title: 'End.DT4 (VPN IPv4 decapsulation)',
            desc: 'Decapsulates the outer IPv6 SR header and performs an IPv4 lookup in a specific VRF table. Used in L3VPN deployments with SRv6 transport.',
            details: ['Removes SRH and outer IPv6 header', 'Performs IPv4 FIB lookup in specified VRF', 'Used in PE router for L3VPN egress'],
            code: [],
          },
          {
            title: 'End.DT6 (VPN IPv6 decapsulation)',
            desc: 'Same as End.DT4 but for IPv6 inner packets. Decapsulates the outer SR header and performs an IPv6 lookup in a VRF.',
            details: ['Removes SRH and outer IPv6 header', 'Performs IPv6 FIB lookup in specified VRF'],
            code: [],
          },
        ],
      },
      flexalgo: {
        label: 'Flex-Algo',
        sections: [
          {
            title: 'What is Flex-Algo?',
            desc: 'Flexible Algorithm (Flex-Algo) allows operators to define custom SPF algorithm constraints within an IGP domain. Each algorithm uses a specific metric type (IGP metric, TE metric, latency) and can exclude certain links.',
            details: ['Algorithms 128-255 are user-defined', 'Algorithm 0 = standard SPF (shortest path)', 'Distributed via OSPF/IS-IS TLV extensions', 'Nodes that do not support Flex-Algo are pruned from the topology'],
            code: ['! Cisco IOS-XR Flex-Algo definition\nsegment-routing\n traffic-eng\n  affinity-map red bit-position 0\n  affinity-map blue bit-position 1\n  affinity-map low-latency bit-position 2\n !'],
          },
          {
            title: 'Use Cases',
            desc: 'Flex-Algo enables topology slicing: different traffic types can use different paths without RSVP-TE complexity.',
            details: ['Algorithm 128: lowest latency path', 'Algorithm 129: excluding maintenance links', 'Algorithm 130: specific link color/affinity'],
            code: [],
          },
        ],
      },
      tilfa: {
        label: 'TI-LFA FRR',
        sections: [
          {
            title: 'Topology-Independent Loop-Free Alternate',
            desc: 'TI-LFA provides 50ms sub-second FRR (Fast Re-Route) protection for SR-MPLS. When a link or node fails, pre-computed backup paths are immediately activated without waiting for IGP convergence.',
            details: ['Computes backup P-Q space paths using segment lists', 'Node protection, link protection, or SRLG protection', 'Sub-50ms failover (dataplane pre-programmed)', 'Works with any IGP topology (no topology restrictions like IP FRR)'],
            code: ['! Enable TI-LFA on IS-IS interface\nrouter isis 1\n interface GigabitEthernet0/0/0\n  fast-reroute per-prefix\n  fast-reroute per-prefix ti-lfa'],
          },
          {
            title: 'How TI-LFA Works',
            desc: 'The router computes backup next-hops using SR segment lists. The repair path encodes a sequence of segments (node SIDs, adjacency SIDs) that routes around the failure point.',
            details: ['P space: nodes reachable from source without using failed link', 'Q space: nodes that can reach destination without using failed link', 'P-Q node (or segment list) forms the repair path'],
            code: [],
          },
        ],
      },
    },
  },
  pt: {
    title: 'Referencia de Segment Routing',
    subtitle: 'Referencia completa de Segment Routing: SR-MPLS, SRv6, Flex-Algo e TI-LFA FRR.',
    sections: 'Topicos',
    references: 'Referencias',
    refList: [
      'RFC 8402 - Arquitetura de Segment Routing',
      'RFC 8986 - Programacao de Rede SRv6',
      'RFC 8665 - Extensoes OSPF para SR',
      'RFC 8667 - Extensoes IS-IS para SR',
    ],
    builtBy: 'Criado por',
    topics: {
      srmpls: {
        label: 'Segmentos SR-MPLS',
        sections: [
          {
            title: 'Node SID',
            desc: 'Um label MPLS globalmente unico que identifica um roteador especifico no dominio SR. Atribuido do Segment Routing Global Block (SRGB). Qualquer pacote com este label sera encaminhado a este no pelo menor caminho IGP.',
            details: ['Globalmente significativo no dominio SR', 'Distribuido via IGP (extensoes TLV de OSPF/IS-IS)', 'Usado para construcao de caminhos TE e direcionamento de trafego'],
            code: ['! Cisco IOS-XR\nsegment-routing\n mpls\n  connected-prefix-sid-map\n   address-family ipv4\n    10.0.0.1/32 index 100 range 1'],
          },
          {
            title: 'Adjacency SID',
            desc: 'Um label MPLS de significancia local representando uma interface/adjacencia especifica entre dois roteadores. O encaminhamento vai para o next-hop especifico independente do menor caminho. Usado para dirigir trafego sobre links especificos.',
            details: ['Localmente significativo (somente no no de origem)', 'Alocado dinamicamente pelo roteador (do bloco local de labels)', 'Pode ser configurado manualmente'],
            code: ['! Exemplo de adjacency SID IS-IS\nrouter isis 1\n interface GigabitEthernet0/0/0\n  segment-routing adjacency-sid index 200'],
          },
          {
            title: 'Prefix SID',
            desc: 'Semelhante ao Node SID, mas pode representar qualquer prefixo IP (nao apenas loopback). O SID de um prefixo e globalmente unico e distribuido via IGP.',
            details: ['Pode representar qualquer prefixo (nao apenas /32 loopbacks)', 'Pode ser label absoluto ou indice (offset da base SRGB)', 'Permite engenharia de trafego por prefixo'],
            code: [],
          },
          {
            title: 'Binding SID (BSID)',
            desc: 'Um label local que mapeia para um caminho SR pre-calculado (lista de segmentos). Quando um pacote chega com o BSID, o roteador substitui pelo stack de segmentos completo. Usado em politicas SR-TE e costura entre dominios.',
            details: ['Mapeia para uma lista de segmentos (politica SR)', 'Permite costura de caminho ponta-a-ponta entre dominios', 'Usado em deployments SR-PCE (Path Computation Element)'],
            code: [],
          },
        ],
      },
      srv6: {
        label: 'Comportamentos SRv6',
        sections: [
          {
            title: 'End (endpoint de no)',
            desc: 'O comportamento SRv6 basico de endpoint. Um no que recebe um pacote com este SID como destino avanca o ponteiro para o proximo segmento no SRH (Segment Routing Header).',
            details: ['Processa o Segment Routing Header (SRH)', 'Decrementa o contador Segments Left', 'Atualiza o endereco IPv6 de destino para o proximo SID'],
            code: ['# SRv6 no kernel Linux\nip -6 route add fc00:1::/64 encap seg6local action End dev lo'],
          },
          {
            title: 'End.X (interconexao L3)',
            desc: 'Encaminha o pacote por uma interface/next-hop especifico quando o SID e correspondido. Analogo ao adjacency SID no SR-MPLS. Usado para engenharia de trafego sobre links especificos.',
            details: ['Encaminha o pacote para um next-hop especifico', 'Processa o SRH antes de encaminhar'],
            code: ['# End.X no Linux\nip -6 route add fc00:1::/64 encap seg6local action End.X nh6 fc00::2 dev eth0'],
          },
          {
            title: 'End.DT4 (desencapsulamento VPN IPv4)',
            desc: 'Desencapsula o cabecalho SR IPv6 externo e realiza busca IPv4 em uma tabela VRF especifica. Usado em deployments L3VPN com transporte SRv6.',
            details: ['Remove SRH e cabecalho IPv6 externo', 'Realiza busca IPv4 na FIB da VRF especificada', 'Usado no roteador PE para egresso de L3VPN'],
            code: [],
          },
          {
            title: 'End.DT6 (desencapsulamento VPN IPv6)',
            desc: 'Igual ao End.DT4 mas para pacotes internos IPv6. Desencapsula o cabecalho SR e realiza busca IPv6 em uma VRF.',
            details: ['Remove SRH e cabecalho IPv6 externo', 'Realiza busca IPv6 na FIB da VRF especificada'],
            code: [],
          },
        ],
      },
      flexalgo: {
        label: 'Flex-Algo',
        sections: [
          {
            title: 'O que e Flex-Algo?',
            desc: 'O Flexible Algorithm (Flex-Algo) permite que operadores definam restricoes de algoritmo SPF customizadas dentro de um dominio IGP. Cada algoritmo usa um tipo de metrica especifico (metrica IGP, metrica TE, latencia) e pode excluir certos links.',
            details: ['Algoritmos 128-255 sao definidos pelo usuario', 'Algoritmo 0 = SPF padrao (menor caminho)', 'Distribuido via extensoes TLV OSPF/IS-IS', 'Nos que nao suportam Flex-Algo sao podados da topologia'],
            code: ['! Definicao de Flex-Algo no Cisco IOS-XR\nsegment-routing\n traffic-eng\n  affinity-map red bit-position 0\n  affinity-map blue bit-position 1\n  affinity-map low-latency bit-position 2'],
          },
          {
            title: 'Casos de Uso',
            desc: 'O Flex-Algo habilita fatias de topologia: diferentes tipos de trafego podem usar diferentes caminhos sem a complexidade do RSVP-TE.',
            details: ['Algoritmo 128: caminho de menor latencia', 'Algoritmo 129: excluindo links em manutencao', 'Algoritmo 130: afinidade/cor de link especifica'],
            code: [],
          },
        ],
      },
      tilfa: {
        label: 'TI-LFA FRR',
        sections: [
          {
            title: 'Topology-Independent Loop-Free Alternate',
            desc: 'O TI-LFA fornece protecao FRR (Fast Re-Route) com sub-50ms para SR-MPLS. Quando um link ou no falha, caminhos de backup pre-calculados sao ativados imediatamente sem esperar convergencia do IGP.',
            details: ['Calcula caminhos de backup no espaco P-Q usando listas de segmentos', 'Protecao de no, link ou SRLG', 'Failover sub-50ms (pre-programado no plano de dados)', 'Funciona com qualquer topologia IGP (sem restricoes como IP FRR)'],
            code: ['! Habilitar TI-LFA na interface IS-IS\nrouter isis 1\n interface GigabitEthernet0/0/0\n  fast-reroute per-prefix\n  fast-reroute per-prefix ti-lfa'],
          },
          {
            title: 'Como o TI-LFA Funciona',
            desc: 'O roteador calcula next-hops de backup usando listas de segmentos SR. O caminho de reparo codifica uma sequencia de segmentos (Node SIDs, Adjacency SIDs) que contorna o ponto de falha.',
            details: ['Espaco P: nos alcancaveis da origem sem usar o link com falha', 'Espaco Q: nos que alcancam o destino sem usar o link com falha', 'No P-Q (ou lista de segmentos) forma o caminho de reparo'],
            code: [],
          },
        ],
      },
    },
  },
} as const

type Lang = keyof typeof translations
type TopicKey = 'srmpls' | 'srv6' | 'flexalgo' | 'tilfa'

const TOPIC_KEYS: TopicKey[] = ['srmpls', 'srv6', 'flexalgo', 'tilfa']

const TOPIC_COLORS: Record<TopicKey, string> = {
  srmpls:   'bg-cyan-500',
  srv6:     'bg-blue-500',
  flexalgo: 'bg-teal-500',
  tilfa:    'bg-indigo-500',
}

const TOPIC_BORDER: Record<TopicKey, string> = {
  srmpls:   'border-cyan-500',
  srv6:     'border-blue-500',
  flexalgo: 'border-teal-500',
  tilfa:    'border-indigo-500',
}

export default function SegmentRoutingReference() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [topic, setTopic] = useState<TopicKey>('srmpls')

  const t = translations[lang]
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const topicData = t.topics[topic]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Cpu size={18} className="text-white" />
            </div>
            <span className="font-semibold">Segment Routing Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/segment-routing-reference" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Topic tabs */}
          <div className="flex flex-wrap gap-2">
            {TOPIC_KEYS.map(key => (
              <button
                key={key}
                onClick={() => setTopic(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${topic === key ? `${TOPIC_COLORS[key]} text-white border-transparent` : `border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800`}`}
              >
                {t.topics[key].label}
              </button>
            ))}
          </div>

          {/* Topic sections */}
          <div className="space-y-4">
            {topicData.sections.map((section, i) => (
              <div key={i} className={`rounded-xl border-2 ${TOPIC_BORDER[topic]} bg-white dark:bg-zinc-900 overflow-hidden`}>
                <div className={`${TOPIC_COLORS[topic]} px-6 py-3`}>
                  <h2 className="text-white font-bold">{section.title}</h2>
                </div>
                <div className="p-6 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{section.desc}</p>
                    <ul className="space-y-1.5">
                      {section.details.map((d, di) => (
                        <li key={di} className="flex items-start gap-2 text-sm">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${TOPIC_COLORS[topic]}`} />
                          <span className="text-zinc-600 dark:text-zinc-400">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {section.code.length > 0 && (
                    <div className="rounded-lg bg-zinc-950 text-zinc-100 p-4 font-mono text-xs whitespace-pre leading-relaxed overflow-x-auto">
                      {section.code.join('\n')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="font-semibold mb-3">{t.references}</h2>
            <ul className="space-y-1">
              {t.refList.map(ref => (
                <li key={ref} className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>{ref}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-cyan-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
