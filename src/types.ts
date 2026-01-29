export interface HabitoBase {
  id: string;
  nome: string;
  categoria: 'Saúde' | 'Trabalho' | 'Estudo' | 'Espírito' | 'Cuidados' | 'Mente' | 'Outros';
}

export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

// O plano é: Para cada dia (chave), temos uma lista de IDs de hábitos (valor)
export type PlanoSemanal = Record<DiaSemana, string[]>;

export type TelaAtual = 'ROTINA' | 'PLANEJAMENTO' | 'HOJE';