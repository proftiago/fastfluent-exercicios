import { useState } from 'react'
import { X } from 'lucide-react'

const TERMOS = `
Última atualização: ${new Date().toLocaleDateString('pt-BR')}

1. ACEITAÇÃO DOS TERMOS
Ao acessar e usar o portal de exercícios da Fast Fluent Idiomas ("Plataforma"), você concorda com estes Termos de Uso. Se você é menor de idade, o uso da Plataforma pressupõe que seu responsável legal já autorizou seu acesso ao matricular você na escola.

2. DESCRIÇÃO DO SERVIÇO
A Plataforma é um portal de apoio pedagógico da Fast Fluent Idiomas, disponibilizando materiais de aula, exercícios, acompanhamento de progresso e histórico de frequência/desempenho aos alunos matriculados.

3. CADASTRO E CONTA
O acesso é feito por login individual, criado pela secretaria da escola. Você é responsável por manter sua senha em sigilo e por todas as atividades realizadas na sua conta. Avise a secretaria imediatamente em caso de suspeita de uso indevido.

4. USO ADEQUADO
Você concorda em não: (a) compartilhar sua conta com terceiros; (b) usar a Plataforma para fins ilegais ou não pedagógicos; (c) tentar acessar dados de outros alunos ou áreas restritas do sistema.

5. PROPRIEDADE INTELECTUAL
Todo o conteúdo pedagógico (materiais, exercícios, textos) é de propriedade da Fast Fluent Idiomas e protegido por direitos autorais. É proibida a reprodução ou distribuição sem autorização.

6. MENORES DE IDADE
Contas de alunos menores de idade são criadas e supervisionadas pela escola em conjunto com os responsáveis legais, no ato da matrícula. Pais/responsáveis podem solicitar acesso, correção ou exclusão de dados a qualquer momento junto à secretaria.

7. ALTERAÇÕES
Estes termos podem ser atualizados periodicamente. O uso continuado da Plataforma após alterações representa aceitação dos novos termos.

8. CONTATO
Dúvidas sobre estes termos podem ser encaminhadas à secretaria da Fast Fluent Idiomas.
`.trim()

const PRIVACIDADE = `
Última atualização: ${new Date().toLocaleDateString('pt-BR')}

Esta Política de Privacidade explica como a Fast Fluent Idiomas coleta, usa e protege seus dados pessoais na Plataforma, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).

1. DADOS QUE COLETAMOS
- Dados de identificação: nome, email, foto de perfil (opcional).
- Dados acadêmicos: turma, nível, lições concluídas, respostas de exercícios, frequência e avaliações.
- Dados técnicos: informações de acesso e uso da Plataforma.

2. FINALIDADE DO USO
Usamos esses dados exclusivamente para: prestar o serviço educacional, acompanhar seu progresso pedagógico, gerar declarações de frequência/desempenho quando solicitadas, e comunicar novidades relevantes sobre suas aulas.

3. BASE LEGAL (LGPD)
O tratamento dos seus dados se baseia na execução do contrato educacional firmado com a escola (matrícula) e, quando aplicável, no legítimo interesse pedagógico.

4. DADOS DE MENORES DE IDADE
Para alunos menores de idade, o tratamento de dados é realizado com base no consentimento do responsável legal, obtido no momento da matrícula na escola.

5. COMPARTILHAMENTO DE DADOS
Não vendemos nem compartilhamos seus dados com terceiros para fins comerciais. Seus dados são armazenados em infraestrutura de provedores de tecnologia (como Supabase) contratados exclusivamente para operação da Plataforma.

6. ARMAZENAMENTO E SEGURANÇA
Adotamos medidas técnicas razoáveis para proteger seus dados contra acesso não autorizado, incluindo controle de acesso por login individual e criptografia de senhas.

7. SEUS DIREITOS
Você (ou seu responsável legal, se menor de idade) pode solicitar a qualquer momento: acesso aos seus dados, correção de informações incorretas, exclusão de dados, ou esclarecimentos sobre o uso deles. Basta entrar em contato com a secretaria da escola.

8. CONTATO
Para exercer seus direitos ou tirar dúvidas sobre esta política, procure a secretaria da Fast Fluent Idiomas.
`.trim()

export function TermosPrivacidade({ abaInicial = 'termos', onFechar }) {
  const [aba, setAba] = useState(abaInicial)

  return (
    <div className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-surface rounded-2xl shadow-card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animar-entrada">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <div className="inline-flex bg-paper border border-line rounded-full p-1">
            <button onClick={() => setAba('termos')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${aba === 'termos' ? 'bg-navy text-white' : 'text-ink-soft'}`}>
              Termos de uso
            </button>
            <button onClick={() => setAba('privacidade')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${aba === 'privacidade' ? 'bg-navy text-white' : 'text-ink-soft'}`}>
              Privacidade
            </button>
          </div>
          <button onClick={onFechar} className="text-ink-faint hover:text-ink-soft transition">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          <p className="text-xs text-ink-soft whitespace-pre-wrap leading-relaxed">
            {aba === 'termos' ? TERMOS : PRIVACIDADE}
          </p>
        </div>
      </div>
    </div>
  )
}
