import { AudioResposta } from './AudioResposta'

export function VisualizarTentativa({ exercicio, tentativa }) {
  const itensBase = exercicio.tipo === 'criar_perguntas' ? exercicio.conteudo.respostas : exercicio.conteudo.perguntas
  const corrigida = tentativa.status !== 'pendente'

  return (
    <div className="space-y-4">
      {exercicio.tipo === 'interpretacao_texto' && (
        <div className="bg-paper rounded-lg p-4 text-sm text-ink whitespace-pre-wrap">{exercicio.conteudo.texto}</div>
      )}

      <div className="space-y-3">
        {itensBase.map((item, i) => {
          const suaResposta = tentativa.resposta?.itens?.find((x) => x.id === item.id)?.texto || '(no answer)'
          const comentario = tentativa.correcao_itens?.find((c) => c.id === item.id)?.comentario

          return (
            <div key={item.id} className="border border-line rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-ink-soft">
                {i + 1}. {exercicio.tipo === 'criar_perguntas' ? item.resposta : item.pergunta}
              </p>
              {item.imagem_url && <img src={item.imagem_url} alt="" className="w-full max-h-40 object-cover rounded-lg" />}
              <p className="text-sm text-ink bg-paper rounded px-2 py-1.5">{suaResposta}</p>
              <AudioResposta caminho={tentativa.resposta?.itens?.find((x) => x.id === item.id)?.audio} />
              {comentario && (
                <p className="text-xs text-teal bg-teal-soft/50 rounded px-2 py-1.5">{comentario}</p>
              )}
            </div>
          )
        })}
      </div>

      {corrigida && (
        <div className="bg-teal-soft rounded-lg p-4 space-y-1">
          <p className="text-sm font-semibold text-teal">Grade: {tentativa.nota ?? '—'}</p>
          {tentativa.feedback && <p className="text-sm text-teal">{tentativa.feedback}</p>}
        </div>
      )}

      {!corrigida && (
        <p className="text-sm text-amber bg-amber-soft rounded-lg px-3 py-2">Awaiting the teacher's grading.</p>
      )}
    </div>
  )
}
