// =====================================================================
// CARTEIRA.JS — lógica da página de carteira
// =====================================================================

let depositType = 'MPESA';

document.addEventListener('DOMContentLoaded', async () => {
  const session = await requireLogin();
  if (!session) return;

  const profile = await initHeader('wallet');
  initFooter();
  updateBalanceDisplay(profile.saldo_carteira);

  document.getElementById('deposit-mpesa').addEventListener('click', () => selectDepositType('MPESA'));
  document.getElementById('deposit-nib').addEventListener('click', () => selectDepositType('NIB'));
  document.getElementById('deposit-submit').addEventListener('click', handleDeposit);
});

function updateBalanceDisplay(saldo) {
  document.getElementById('balance-value').innerHTML = `${Number(saldo).toFixed(2)} <span style="font-size:1.125rem;">MZN</span>`;
}

function selectDepositType(tipo) {
  depositType = tipo;
  document.getElementById('deposit-mpesa').classList.toggle('btn-primary', tipo === 'MPESA');
  document.getElementById('deposit-mpesa').classList.toggle('btn-outline', tipo !== 'MPESA');
  document.getElementById('deposit-nib').classList.toggle('btn-primary', tipo === 'NIB');
  document.getElementById('deposit-nib').classList.toggle('btn-outline', tipo !== 'NIB');
}

async function handleDeposit() {
  const input = document.getElementById('deposit-amount');
  const valor = parseFloat(input.value);
  if (!valor || valor <= 0) {
    alert('Insira um valor válido.');
    return;
  }

  const btn = document.getElementById('deposit-submit');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const novoSaldo = await callRpc('carregar_saldo', { p_tipo: depositType, p_valor: valor });
    updateBalanceDisplay(novoSaldo);
    input.value = '';
    alert(`Carregamento de ${valor.toFixed(2)} MZN via ${depositType} realizado com sucesso!`);
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Carregar';
  }
}
