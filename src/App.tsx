import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle, Circle, RefreshCw, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// ✅ SUA API (Mantenha o link que já estava funcionando)
const API_URL = import.meta.env.VITE_API_URL || 'https://bd-italocampos-backend-produtividade.t8sftf.easypanel.host';

interface Meta {
  id: number;
  titulo: string;
  categoria: string;
  concluida: boolean;
}

function App() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  
  // 3. ESTADO DA DATA (Começa sempre HOJE no horário local)
  const [dataAtual, setDataAtual] = useState(() => {
    const hoje = new Date();
    hoje.setHours(hoje.getHours() - 3); // Ajuste fuso Brasil (se necessário) ou usar toLocaleDateString
    return hoje.toISOString().split('T')[0];
  });

  // Carrega sempre que a data mudar
  useEffect(() => {
    carregarMetas();
  }, [dataAtual]);

  async function carregarMetas() {
    setLoading(true);
    try {
      // Busca as metas da data selecionada na tela
      const res = await axios.get(`${API_URL}/metas?data=${dataAtual}`);
      setMetas(res.data);
      setErro('');
    } catch (error) {
      console.error("Erro", error);
      setErro('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }

  async function adicionarMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    const tempId = Date.now();
    const novaMetaTemp = { id: tempId, titulo: novoTitulo, categoria: 'Rotina', concluida: false };
    
    // Adiciona na lista visualmente
    setMetas([...metas, novaMetaTemp]);
    setNovoTitulo('');

    try {
      const res = await axios.post(`${API_URL}/metas`, {
        titulo: novoTitulo,
        categoria: 'Rotina',
        data: dataAtual // Salva na data que está aparecendo na tela!
      });
      setMetas(prev => prev.map(m => m.id === tempId ? res.data : m));
    } catch (error) {
      alert('Erro ao salvar.');
      carregarMetas();
    }
  }

  async function toggleMeta(id: number, estadoAtual: boolean) {
    // Atualiza localmente
    const novasMetas = metas.map(m => m.id === id ? { ...m, concluida: !estadoAtual } : m);
    setMetas(novasMetas);
    
    // Atualiza no banco
    await axios.patch(`${API_URL}/metas/${id}/toggle`, { concluida: !estadoAtual });
  }

  async function deletarMeta(id: number) {
    if (!confirm('Deletar meta?')) return;
    setMetas(metas.filter(m => m.id !== id));
    await axios.delete(`${API_URL}/metas/${id}`);
  }

  // FUNÇÃO PARA MUDAR OS DIAS
  function mudarDia(dias: number) {
    const novaData = new Date(dataAtual);
    novaData.setDate(novaData.getDate() + dias + 1); // +1 corrige bug de timezone do JS ao converter string
    setDataAtual(novaData.toISOString().split('T')[0]);
  }

  // Formata a data para exibir bonito (Ex: "19/01 - Segunda")
  function formatarDataExibicao(isoDate: string) {
    const dataObj = new Date(isoDate + 'T12:00:00'); // Força meio-dia para não voltar dia com fuso
    const hoje = new Date().toISOString().split('T')[0];
    
    if (isoDate === hoje) return "Hoje";
    
    return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + 
           ` • ${dataObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}`;
  }

  // 1. LÓGICA DE ORDENAÇÃO (Pendentes em cima, Concluídas em baixo)
  const metasOrdenadas = [...metas].sort((a, b) => {
    return Number(a.concluida) - Number(b.concluida);
  });

  // Cálculos de Progresso
  const total = metas.length;
  const feitas = metas.filter(m => m.concluida).length;
  const progresso = total === 0 ? 0 : Math.round((feitas / total) * 100);

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-slate-900 text-white font-sans">
      
      {/* Header com Navegação de Datas */}
      <header className="p-6 pt-10 bg-slate-800 rounded-b-3xl shadow-lg border-b border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Minha Rotina 🚀
            </h1>
          </div>
          <button onClick={carregarMetas} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition">
            <RefreshCw size={18} className={loading ? "animate-spin text-green-400" : "text-white"} />
          </button>
        </div>

        {/* CONTROLE DE DATA */}
        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-slate-700 mb-4">
          <button onClick={() => mudarDia(-1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Calendar size={18} className="text-green-500"/>
            <span className="capitalize">{formatarDataExibicao(dataAtual)}</span>
          </div>

          <button onClick={() => mudarDia(1)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
            <ChevronRight size={24} />
          </button>
        </div>
        
        {/* Barra de Progresso */}
        <div className="relative h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-emerald-400 transition-all duration-500" 
            style={{ width: `${progresso}%` }}
          />
        </div>
        <p className="text-right text-xs font-bold mt-2 text-green-400">{progresso}% CONCLUÍDO</p>
      </header>

      {/* Lista de Tarefas (Usa a lista ORDENADA) */}
      <main className="p-4 space-y-3 mt-2">
        {erro && <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm text-center">{erro}</div>}
        
        {loading && metas.length === 0 ? (
          <div className="text-center py-10 animate-pulse text-slate-500">Carregando...</div>
        ) : metasOrdenadas.map(meta => (
          <div key={meta.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${meta.concluida ? 'bg-slate-900/30 border-slate-800 opacity-50 order-last' : 'bg-slate-800 border-slate-700 order-first'}`}>
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleMeta(meta.id, meta.concluida)}>
              {meta.concluida ? <CheckCircle className="text-green-500 shrink-0" /> : <Circle className="text-slate-500 shrink-0" />}
              <span className={meta.concluida ? 'line-through text-slate-500 transition-all' : 'text-slate-100 transition-all'}>{meta.titulo}</span>
            </div>
            <button onClick={() => deletarMeta(meta.id)} className="text-slate-600 hover:text-red-400 p-2"><Trash2 size={18} /></button>
          </div>
        ))}
        
        {!loading && metas.length === 0 && (
          <p className="text-center text-slate-600 mt-10 text-sm">Nenhuma tarefa para este dia.</p>
        )}
      </main>

      <form onSubmit={adicionarMeta} className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex gap-2 max-w-md mx-auto">
        <input 
          type="text" 
          value={novoTitulo}
          onChange={e => setNovoTitulo(e.target.value)}
          placeholder={`Meta para ${formatarDataExibicao(dataAtual)}...`} 
          className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-3 outline-none border border-slate-700 focus:border-green-500"
        />
        <button type="submit" disabled={!novoTitulo} className="bg-green-600 text-white p-3 rounded-lg"><Plus /></button>
      </form>
    </div>
  );
}

export default App;