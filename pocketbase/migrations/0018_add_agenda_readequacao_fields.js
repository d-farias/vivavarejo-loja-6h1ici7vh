/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Atualizar collection `rotinas` com campos opcionais para prioridade do dia e readequação
    const rotinasCol = app.findCollectionByNameOrId('rotinas')

    if (!rotinasCol.fields.getByName('prioridade_dia')) {
      rotinasCol.fields.add(
        new NumberField({
          name: 'prioridade_dia',
          required: false,
          onlyInt: true,
        }),
      )
    }

    if (!rotinasCol.fields.getByName('adiada_para_data')) {
      rotinasCol.fields.add(
        new TextField({
          name: 'adiada_para_data',
          required: false,
        }),
      )
    }

    if (!rotinasCol.fields.getByName('adiada_para_horario')) {
      rotinasCol.fields.add(
        new TextField({
          name: 'adiada_para_horario',
          required: false,
        }),
      )
    }

    app.save(rotinasCol)

    // 2. Atualizar collection `execucoes_rotinas` com campos para readequação específica do dia
    const execsCol = app.findCollectionByNameOrId('execucoes_rotinas')

    if (!execsCol.fields.getByName('horario_planejado')) {
      execsCol.fields.add(
        new TextField({
          name: 'horario_planejado',
          required: false,
        }),
      )
    }

    if (!execsCol.fields.getByName('prioridade_dia')) {
      execsCol.fields.add(
        new NumberField({
          name: 'prioridade_dia',
          required: false,
          onlyInt: true,
        }),
      )
    }

    if (!execsCol.fields.getByName('adiada_para_data')) {
      execsCol.fields.add(
        new TextField({
          name: 'adiada_para_data',
          required: false,
        }),
      )
    }

    if (!execsCol.fields.getByName('motivo_adiamento')) {
      execsCol.fields.add(
        new TextField({
          name: 'motivo_adiamento',
          required: false,
        }),
      )
    }

    app.save(execsCol)
  },
  (app) => {
    const rotinasCol = app.findCollectionByNameOrId('rotinas')
    if (rotinasCol.fields.getByName('prioridade_dia')) {
      rotinasCol.fields.removeByName('prioridade_dia')
    }
    if (rotinasCol.fields.getByName('adiada_para_data')) {
      rotinasCol.fields.removeByName('adiada_para_data')
    }
    if (rotinasCol.fields.getByName('adiada_para_horario')) {
      rotinasCol.fields.removeByName('adiada_para_horario')
    }
    app.save(rotinasCol)

    const execsCol = app.findCollectionByNameOrId('execucoes_rotinas')
    if (execsCol.fields.getByName('horario_planejado')) {
      execsCol.fields.removeByName('horario_planejado')
    }
    if (execsCol.fields.getByName('prioridade_dia')) {
      execsCol.fields.removeByName('prioridade_dia')
    }
    if (execsCol.fields.getByName('adiada_para_data')) {
      execsCol.fields.removeByName('adiada_para_data')
    }
    if (execsCol.fields.getByName('motivo_adiamento')) {
      execsCol.fields.removeByName('motivo_adiamento')
    }
    app.save(execsCol)
  },
)
